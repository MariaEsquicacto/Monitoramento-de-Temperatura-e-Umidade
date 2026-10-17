"""
Script de Diagnóstico e Validação Rápida de Conexão.
Executa uma única verificação de ponta a ponta:
1. Verifica se o Realtime Database responde e exibe os dados lidos.
2. Verifica se as credenciais do Firestore são válidas e insere um documento de teste.
"""

import sys
import json
import logging
from pathlib import Path

from config import (
    DATABASE_URL,
    PROJECT_ID,
    SERVICE_ACCOUNT_KEY_PATH,
    FIRESTORE_COLLECTION_MAIN,
    RTDB_NODE
)
from firebase_service import FirebaseService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("TestConnection")


def run_test():
    print("=" * 65)
    print("   DIAGNÓSTICO DE CONEXÃO FIREBASE (PYTHONANYWHERE)")
    print("=" * 65)

    key_path = Path(SERVICE_ACCOUNT_KEY_PATH)
    print(f"\n[1] Verificação de Credenciais:")
    print(f" • Caminho da chave : {SERVICE_ACCOUNT_KEY_PATH}")
    if key_path.exists():
        print(f" • Status da chave  : ENCONTRADA (tamanho: {key_path.stat().st_size} bytes)")
    else:
        print(f" • Status da chave  : [NÃO ENCONTRADA]")
        print("   -> Lembre-se de fazer o upload do 'serviceAccountKey.json' obtido no")
        print("      Firebase Console > Configurações do Projeto > Contas de Serviço.")

    print(f"\n[2] Inicialização do Serviço Firebase:")
    service = FirebaseService()
    print(f" • SDK Admin Ativo  : {'SIM' if service.admin_initialized else 'NÃO (Operando em modo restrito)'}")

    print(f"\n[3] Leitura do Realtime Database (Nó: '{RTDB_NODE}'):")
    data = service.fetch_rtdb_data()
    if data is not None:
        print(" • Leitura RTDB     : SUCESSO!")
        print(" • Dados recebidos  :")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(" • Leitura RTDB     : [FALHA] - Não foi possível obter dados da URL:")
        print(f"   {DATABASE_URL}")
        return False

    print(f"\n[4] Gravação de Teste no Cloud Firestore:")
    if not service.admin_initialized:
        print(" • Gravação Firestore: [IGNORADA]")
        print("   -> É necessário ter o 'serviceAccountKey.json' para gravar no Firestore.")
        return False

    success, doc_id = service.insert_firestore_document(data)
    if success:
        print(" • Gravação Firestore: SUCESSO!")
        print(f" • ID do Documento   : {doc_id}")
        print(f" • Coleção Utilizada : {FIRESTORE_COLLECTION_MAIN}")
    else:
        print(" • Gravação Firestore: [FALHA]")
        return False

    print("\n" + "=" * 65)
    print("   RESULTADO DO DIAGNÓSTICO: TUDO FUNCIONANDO PERFEITAMENTE!")
    print("   Você já pode iniciar o serviço contínuo com:")
    print("   python main.py")
    print("=" * 65 + "\n")
    return True


if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
