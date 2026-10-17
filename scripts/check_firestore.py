import requests
import json

# Testa leitura da coleção historico_leituras via Firestore REST API
project_id = "gemini-project---analise-5f616"
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/historico_leituras"

print(f"Consultando Firestore: {url}")
try:
    resp = requests.get(url, timeout=10)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print(f"Documentos encontrados:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Erro: {e}")
