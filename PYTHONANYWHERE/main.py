"""
Aplicação Principal de Sincronização Contínua - PythonAnywhere
Executa a cada 20 segundos coletando dados do Firebase Realtime Database
e inserindo um novo documento no Cloud Firestore.
"""

import sys
import time
import signal
import logging
from datetime import datetime

from config import (
    SYNC_INTERVAL_SECONDS,
    DATABASE_URL,
    PROJECT_ID,
    FIRESTORE_COLLECTION_MAIN,
    SYNC_TO_READINGS_HISTORY,
    FIRESTORE_COLLECTION_HISTORY,
    SERVICE_ACCOUNT_KEY_PATH
)
from firebase_service import FirebaseService

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("Main")

running = True


def handle_shutdown(signum, frame):
    """Manipulador para encerramento gracioso do serviço (Ctrl+C ou SIGTERM)."""
    global running
    sig_name = "SIGINT (Ctrl+C)" if signum == signal.SIGINT else f"Sinal {signum}"
    logger.info(f"\n[Shutdown] Recebido {sig_name}. Encerrando loop de sincronização...")
    running = False


def print_banner():
    """Exibe informações iniciais do serviço."""
    print("=" * 65)
    print("   INTEGRAÇÃO FIREBASE: REALTIME DB -> FIRESTORE")
    print("   Execução em Segundo Plano no PythonAnywhere")
    print("=" * 65)
    print(f" • Projeto Firebase        : {PROJECT_ID}")
    print(f" • URL Realtime Database   : {DATABASE_URL}")
    print(f" • Intervalo de Busca      : {SYNC_INTERVAL_SECONDS} segundos")
    print(f" • Coleção Principal       : {FIRESTORE_COLLECTION_MAIN}")
    print(f" • Espelhamento Histórico  : {'Ativo (' + FIRESTORE_COLLECTION_HISTORY + ')' if SYNC_TO_READINGS_HISTORY else 'Desativado'}")
    print(f" • Chave Service Account   : {SERVICE_ACCOUNT_KEY_PATH}")
    print("=" * 65)
    print("Pressione Ctrl+C para interromper a execução a qualquer momento.\n")


def main():
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    print_banner()

    logger.info("[Inicialização] Criando instância do serviço Firebase...")
    service = FirebaseService()

    cycle_count = 0

    while running:
        cycle_count += 1
        logger.info(f"\n>>> CICLO #{cycle_count} <<<")

        try:
            service.execute_sync_cycle()
        except Exception as e:
            logger.error(f"[Erro Inesperado] Exceção durante ciclo #{cycle_count}: {e}", exc_info=True)

        if not running:
            break

        logger.info(f"[Aguardando] Próxima coleta em {SYNC_INTERVAL_SECONDS} segundos...")

        # Aguarda o intervalo de forma fracionada para responder rapidamente ao Ctrl+C
        sleep_elapsed = 0
        while sleep_elapsed < SYNC_INTERVAL_SECONDS and running:
            time.sleep(1)
            sleep_elapsed += 1

    logger.info("[Finalizado] Serviço encerrado com sucesso.")


if __name__ == "__main__":
    main()
