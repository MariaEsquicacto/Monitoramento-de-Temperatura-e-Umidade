"""
Serviço de integração Firebase:
- Coleta dados de temperatura, umidade e status do Firebase Realtime Database.
- Grava novo documento estruturado no Cloud Firestore.
- Opcionalmente alimenta a coleção 'readings_history' compatível com o dashboard Web.
"""

import os
import sys
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import requests
from config import (
    DATABASE_URL,
    PROJECT_ID,
    SERVICE_ACCOUNT_KEY_PATH,
    FIRESTORE_COLLECTION_MAIN,
    SYNC_TO_READINGS_HISTORY,
    FIRESTORE_COLLECTION_HISTORY,
    RTDB_NODE
)

logger = logging.getLogger("FirebaseSync")


def parse_float_safe(value: Any, default: float = 0.0) -> float:
    """Converte valores numéricos ou strings (inclusive com vírgula) para float de forma segura."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    try:
        # Trata formato brasileiro com vírgula (ex: "23,5")
        str_val = str(value).strip().replace(',', '.')
        return float(str_val)
    except (ValueError, TypeError):
        return default


class FirebaseService:
    def __init__(self):
        self.admin_initialized = False
        self.db_firestore = None
        self.rtdb_ref = None
        self._init_firebase()

    def _init_firebase(self) -> None:
        """Inicializa o SDK Firebase Admin caso as credenciais estejam disponíveis."""
        key_path = Path(SERVICE_ACCOUNT_KEY_PATH)
        if not key_path.exists():
            logger.warning(
                f"[AVISO] Arquivo de credenciais '{SERVICE_ACCOUNT_KEY_PATH}' não encontrado.\n"
                f"-> Para gravar no Firestore, é necessário o arquivo JSON da conta de serviço.\n"
                f"-> A leitura do Realtime Database ainda poderá ocorrer via REST se o nó for público."
            )
            return

        try:
            import firebase_admin
            from firebase_admin import credentials, firestore, db

            if not firebase_admin._apps:
                cred = credentials.Certificate(str(key_path))
                firebase_admin.initialize_app(cred, {
                    'databaseURL': DATABASE_URL,
                    'projectId': PROJECT_ID
                })
                logger.info("[Firebase Admin] Inicializado com sucesso via Service Account.")
            else:
                logger.info("[Firebase Admin] Aplicação Firebase já inicializada previamente.")

            self.db_firestore = firestore.client()
            self.admin_initialized = True

        except Exception as e:
            logger.error(f"[Firebase Admin] Falha ao inicializar SDK Admin: {e}", exc_info=True)
            self.admin_initialized = False

    def fetch_rtdb_data(self) -> Optional[Dict[str, Any]]:
        """
        Coleta as informações de temperatura, umidade e controle do Realtime Database.
        Prioriza o Firebase Admin SDK; se indisponível, utiliza fallback REST HTTP.
        """
        # Método 1: Firebase Admin SDK
        if self.admin_initialized:
            try:
                from firebase_admin import db
                node_clean = RTDB_NODE.strip('/')
                ref = db.reference(node_clean if node_clean else '/')
                val = ref.get()
                if val is not None:
                    return val
            except Exception as e:
                logger.warning(f"[RTDB Admin] Erro na leitura via Admin SDK, tentando REST: {e}")

        # Método 2: Requisição REST direta (100% compatível com proxy do PythonAnywhere)
        try:
            node_clean = RTDB_NODE.strip('/')
            path_suffix = f"/{node_clean}.json" if node_clean else "/.json"
            url = f"{DATABASE_URL.rstrip('/')}{path_suffix}"

            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"[RTDB REST] Erro HTTP {response.status_code} ao buscar dados: {response.text}")
                return None
        except Exception as e:
            logger.error(f"[RTDB REST] Exceção ao buscar dados via REST: {e}")
            return None

    def insert_firestore_document(self, raw_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Recebe os dados coletados do Realtime Database e insere um novo documento no Firestore.
        Também popula 'readings_history' se SYNC_TO_READINGS_HISTORY estiver ativo.
        """
        if not self.admin_initialized or not self.db_firestore:
            logger.error(
                "[Firestore] Não é possível gravar no Firestore: SDK Firebase Admin não inicializado. "
                "Verifique se o arquivo 'serviceAccountKey.json' está presente e válido."
            )
            return False, None

        try:
            now_utc = datetime.now(timezone.utc)
            now_ms = int(time.time() * 1000)

            # Normaliza estrutura dos dados
            ambiente = raw_data.get('ambiente', {})
            controle = raw_data.get('controle', {})

            # Caso o nó lido seja diretamente o 'ambiente'
            if 'sensor1' in raw_data and 'ambiente' not in raw_data:
                ambiente = raw_data

            # Tratamento e sanitização dos sensores
            s1 = ambiente.get('sensor1', {})
            s2 = ambiente.get('sensor2', {})

            s1_temp = parse_float_safe(s1.get('temperatura', s1.get('temperature', 0.0)))
            s1_hum = parse_float_safe(s1.get('umidade', s1.get('humidity', 0.0)))

            s2_temp = parse_float_safe(s2.get('temperatura', s2.get('temperature', 0.0)))
            s2_hum = parse_float_safe(s2.get('umidade', s2.get('humidity', 0.0)))

            lampada_status = bool(controle.get('lampada', False))

            # 1. Documento Consolidado na coleção principal
            novo_documento = {
                "timestamp": now_ms,
                "data_hora": now_utc.isoformat(),
                "data_hora_formatada": now_utc.strftime("%d/%m/%Y %H:%M:%S UTC"),
                "ambiente": {
                    "sensor1": {
                        "temperatura": s1_temp,
                        "umidade": s1_hum
                    },
                    "sensor2": {
                        "temperatura": s2_temp,
                        "umidade": s2_hum
                    }
                },
                "controle": {
                    "lampada": lampada_status
                },
                "origem": "pythonanywhere_sync"
            }

            col_ref = self.db_firestore.collection(FIRESTORE_COLLECTION_MAIN)
            _, doc_ref = col_ref.add(novo_documento)
            doc_id = doc_ref.id
            logger.info(f"[Firestore] Inserido novo documento na coleção '{FIRESTORE_COLLECTION_MAIN}' -> ID: {doc_id}")

            # 2. Inserção opcional na coleção 'readings_history' (usada pelos gráficos e tabelas da Web App)
            if SYNC_TO_READINGS_HISTORY:
                hist_col = self.db_firestore.collection(FIRESTORE_COLLECTION_HISTORY)

                # Leitura Sala 1 (Sensor 1)
                hist_col.add({
                    "roomId": "sala_1",
                    "sensorId": "sensor1",
                    "temperature": s1_temp,
                    "humidity": s1_hum,
                    "timestamp": now_ms,
                    "sensorStatus": "online",
                    "origem": "pythonanywhere_sync"
                })

                # Leitura Sala 2 (Sensor 2)
                hist_col.add({
                    "roomId": "sala_2",
                    "sensorId": "sensor2",
                    "temperature": s2_temp,
                    "humidity": s2_hum,
                    "timestamp": now_ms,
                    "sensorStatus": "online",
                    "origem": "pythonanywhere_sync"
                })
                logger.info(f"[Firestore] Leituras individuais gravadas com sucesso em '{FIRESTORE_COLLECTION_HISTORY}' (sala_1 e sala_2).")

            return True, doc_id

        except Exception as e:
            logger.error(f"[Firestore] Erro ao inserir documento no Firestore: {e}", exc_info=True)
            return False, None

    def execute_sync_cycle(self) -> bool:
        """Executa um ciclo completo de coleta no Realtime Database e gravação no Firestore."""
        logger.info("-" * 60)
        logger.info(f"[Ciclo] Iniciando coleta no Realtime Database às {datetime.now().strftime('%H:%M:%S')}...")

        data = self.fetch_rtdb_data()
        if data is None:
            logger.warning("[Ciclo] Nenhum dado obtido do Realtime Database neste ciclo.")
            return False

        logger.info(f"[Ciclo] Dados recebidos do RTDB: {data}")
        success, doc_id = self.insert_firestore_document(data)
        if success:
            logger.info(f"[Ciclo] Sincronização concluída com sucesso! Documento Firestore: {doc_id}")
            return True
        else:
            logger.error("[Ciclo] Falha ao persistir no Firestore.")
            return False
