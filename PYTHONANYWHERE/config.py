"""
Módulo de Configuração para o serviço de sincronização Firebase no PythonAnywhere.
Carrega parâmetros a partir de variáveis de ambiente (.env) ou valores padrão do projeto.
"""

import os
from pathlib import Path

# Tenta carregar variáveis do arquivo .env se python-dotenv estiver instalado
try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent
    env_file = BASE_DIR / '.env'
    if env_file.exists():
        load_dotenv(dotenv_path=env_file)
    else:
        load_dotenv()
except ImportError:
    pass

# URL do Firebase Realtime Database
# Padrão apontado para a instância do projeto MedTrack / SENAI
DATABASE_URL = os.getenv(
    'FIREBASE_DATABASE_URL',
    'https://gemini-project---analise-5f616-default-rtdb.firebaseio.com/'
)

# Project ID do Google Cloud / Firebase
PROJECT_ID = os.getenv(
    'FIREBASE_PROJECT_ID',
    'gemini-project---analise-5f616'
)

# Caminho para o arquivo JSON da conta de serviço (Service Account)
# Gerado no Firebase Console > Configurações do Projeto > Contas de Serviço
SERVICE_ACCOUNT_KEY_PATH = os.getenv(
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    str(Path(__file__).resolve().parent / 'serviceAccountKey.json')
)

# Intervalo de busca e inserção em segundos (Requisito: 20 segundos)
SYNC_INTERVAL_SECONDS = int(os.getenv('SYNC_INTERVAL_SECONDS', '20'))

# Nome da coleção principal no Firestore onde cada snapshot será gravado
FIRESTORE_COLLECTION_MAIN = os.getenv(
    'FIRESTORE_COLLECTION_MAIN',
    'leituras_ambiente'
)

# Se True, também alimenta a coleção 'readings_history' com cada sensor individual,
# permitindo que os gráficos e tabelas históricas da aplicação Web reflitam os dados automaticamente
SYNC_TO_READINGS_HISTORY = os.getenv(
    'SYNC_TO_READINGS_HISTORY',
    'true'
).lower() in ('true', '1', 't', 'yes', 'sim')

# Nome da coleção histórica utilizada pela aplicação Web
FIRESTORE_COLLECTION_HISTORY = os.getenv(
    'FIRESTORE_COLLECTION_HISTORY',
    'readings_history'
)

# Nó do Realtime Database a ser lido ('/' lê todo o nó com ambiente e controle)
RTDB_NODE = os.getenv('RTDB_NODE', '/')
