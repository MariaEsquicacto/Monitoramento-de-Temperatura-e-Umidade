# 🚀 Integração Firebase: Realtime Database -> Cloud Firestore (PythonAnywhere)

Este módulo foi desenvolvido para executar como um serviço de sincronização no **PythonAnywhere**, coletando periodicamente as informações de temperatura, umidade e controle do nó JSON no **Firebase Realtime Database** e persistindo automaticamente novos documentos estruturados no **Cloud Firestore** a cada **20 segundos**.

---

## 📋 Sumário
1. [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2. [Estrutura dos Arquivos](#-estrutura-dos-arquivos)
3. [Passo 1: Gerar a Chave de Serviço no Firebase](#-passo-1-gerar-a-chave-de-serviço-no-firebase)
4. [Passo 2: Implantação no PythonAnywhere](#-passo-2-implantação-no-pythonanywhere)
5. [Passo 3: Execução e Modos de Operação](#-passo-3-execução-e-modos-de-operação)
6. [Estrutura dos Dados no Firestore](#-estrutura-dos-dados-no-firestore)
7. [Diagnóstico e Resolução de Problemas](#-diagnóstico-e-resolução-de-problemas)

---

## 🏗 Visão Geral e Arquitetura

O serviço lê o nó raiz ou `/ambiente` do Realtime Database com a seguinte estrutura:

```json
{
  "ambiente": {
    "sensor1": {
      "temperatura": 22.5,
      "umidade": 50.0
    },
    "sensor2": {
      "temperatura": 21.0,
      "umidade": 48.0
    }
  },
  "controle": {
    "lampada": false
  }
}
```

A cada **20 segundos** (`SYNC_INTERVAL_SECONDS = 20`):
1. **Lê** os dados mais recentes do Realtime Database.
2. **Formata e higieniza** os valores numéricos de temperatura e umidade.
3. **Insere um novo documento** no Cloud Firestore na coleção `leituras_ambiente`.
4. **Espelha opcionalmente** as leituras individuais na coleção `readings_history` (`sala_1` e `sala_2`), garantindo que o dashboard e os gráficos históricos da aplicação Web MedTrack IoT continuem sendo alimentados em tempo real de forma totalmente integrada.

---

## 📁 Estrutura dos Arquivos

```
PYTHONANYWHERE/
├── main.py                     # Script principal com loop contínuo de 20 segundos
├── firebase_service.py         # Lógica de conexão, leitura no RTDB e gravação no Firestore
├── config.py                   # Centralização de configurações e variáveis de ambiente
├── test_connection.py          # Script de validação e diagnóstico (executa 1 ciclo de teste)
├── simulate_sensors.py         # Utilitário para simular/variar valores no RTDB (opcional)
├── requirements.txt            # Dependências Python (firebase-admin, requests, python-dotenv)
├── .env.example                # Modelo de arquivo de configuração de ambiente
├── serviceAccountKey.example.json # Modelo da chave da conta de serviço
└── README.md                   # Este guia de implantação completo
```

---

## 🔑 Passo 1: Gerar a Chave de Serviço no Firebase

Para que o script no PythonAnywhere tenha autorização segura para gravar no Firestore, é necessário gerar a chave privada da conta de serviço no Firebase:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Abra o projeto: **`gemini-project---analise-5f616`**.
3. No canto superior esquerdo, clique no ícone de engrenagem ⚙️ ao lado de *Visão geral do projeto* e selecione **Configurações do projeto**.
4. Acesse a aba **Contas de serviço** (*Service Accounts*).
5. Certifique-se de que a opção **Python** está selecionada e clique no botão **Gerar nova chave privada** (*Generate new private key*).
6. Um arquivo `.json` será baixado no seu computador.
7. Renomeie esse arquivo para **`serviceAccountKey.json`**.

---

## ☁️ Passo 2: Implantação no PythonAnywhere

### 2.1 Criar conta ou acessar o PythonAnywhere
Acesse [pythonanywhere.com](https://www.pythonanywhere.com/) e faça login na sua conta (conta gratuita *Beginner* ou superior).

### 2.2 Fazer upload dos arquivos
Existem duas formas simples de colocar os arquivos no PythonAnywhere:

#### Opção A (Via Navegador / Aba Files - Mais Simples):
1. No painel do PythonAnywhere, vá até a aba **Files**.
2. No campo **Directories**, digite `PYTHONANYWHERE` e clique em **New directory**.
3. Entre na pasta criada `/home/seuusuario/PYTHONANYWHERE/`.
4. No botão **Upload a file**, faça o upload de:
   - `main.py`
   - `firebase_service.py`
   - `config.py`
   - `test_connection.py`
   - `simulate_sensors.py`
   - `requirements.txt`
   - `serviceAccountKey.json` *(o arquivo baixado do Firebase no Passo 1)*

#### Opção B (Via Git Clone):
Se o projeto estiver hospedado em repositório Git:
1. Abra um **Bash Console** no PythonAnywhere.
2. Clone o repositório e acesse a pasta:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd "Monitoramento-de-Temperatura-e-Umidade/PYTHONANYWHERE"
   ```
3. Envie o arquivo `serviceAccountKey.json` para dentro dessa pasta.

---

## ⚙️ Passo 3: Execução e Modos de Operação

### 3.1 Abrir um Console Bash no PythonAnywhere
No painel do PythonAnywhere, clique na aba **Consoles** e abra um **Bash**.

Navegue até a pasta do projeto:
```bash
cd ~/PYTHONANYWHERE
```

### 3.2 Criar um Ambiente Virtual e Instalar Dependências
Execute os comandos abaixo para isolar o ambiente Python:

```bash
# Cria o ambiente virtual chamado 'firebase_env' com Python 3.10
python3.10 -m venv firebase_env

# Ativa o ambiente virtual
source firebase_env/bin/activate

# Atualiza o pip e instala as dependências
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Testar a Conexão (Diagnóstico)
Antes de rodar em loop, execute o script de teste de conexão:

```bash
python test_connection.py
```

Você deverá ver uma mensagem de sucesso:
```
=================================================================
   DIAGNÓSTICO DE CONEXÃO FIREBASE (PYTHONANYWHERE)
=================================================================
[1] Verificação de Credenciais:
 • Status da chave  : ENCONTRADA

[2] Inicialização do Serviço Firebase:
 • SDK Admin Ativo  : SIM

[3] Leitura do Realtime Database:
 • Leitura RTDB     : SUCESSO!
 • Dados recebidos  : { "ambiente": ... }

[4] Gravação de Teste no Cloud Firestore:
 • Gravação Firestore: SUCESSO!
 • ID do Documento   : xxxxxxxxxxxx
=================================================================
   RESULTADO DO DIAGNÓSTICO: TUDO FUNCIONANDO PERFEITAMENTE!
=================================================================
```

---

### 3.4 Iniciar o Serviço de Sincronização

#### Modo A: Execução Interativa no Console (Para Acompanhar em Tempo Real)
```bash
python main.py
```
O console exibirá cada ciclo a cada 20 segundos. Pressione `Ctrl + C` para parar.

#### Modo B: Execução em Segundo Plano (Background com nohup)
Para que o script continue rodando mesmo se você fechar o navegador:
```bash
nohup python main.py > sync.log 2>&1 &
```
- Para ver o log em tempo real:
  ```bash
  tail -f sync.log
  ```
- Para verificar se o processo está em execução:
  ```bash
  ps aux | grep main.py
  ```
- Para parar a execução em background:
  ```bash
  pkill -f main.py
  ```

#### Modo C: Always-On Tasks (Contas Hacker / Pagas do PythonAnywhere)
Se você possuir uma conta paga do PythonAnywhere:
1. Vá até a aba **Tasks**.
2. Na seção **Always-on tasks**, adicione o comando:
   ```bash
   /home/seuusuario/PYTHONANYWHERE/firebase_env/bin/python /home/seuusuario/PYTHONANYWHERE/main.py
   ```
3. O PythonAnywhere irá manter o script executando 24/7 e reiniciará o processo automaticamente em caso de reinicialização dos servidores.

---

## 📊 Estrutura dos Dados no Firestore

### 1. Coleção Principal: `leituras_ambiente`
A cada 20 segundos, um documento é inserido com a seguinte estrutura:

```json
{
  "timestamp": 1776445504000,
  "data_hora": "2026-10-17T17:05:04.123456+00:00",
  "data_hora_formatada": "17/10/2026 17:05:04 UTC",
  "ambiente": {
    "sensor1": {
      "temperatura": 22.4,
      "umidade": 50.2
    },
    "sensor2": {
      "temperatura": 21.8,
      "umidade": 46.5
    }
  },
  "controle": {
    "lampada": false
  },
  "origem": "pythonanywhere_sync"
}
```

### 2. Coleção Integrada à Aplicação Web: `readings_history`
Simultaneamente, para alimentar a aplicação Web sem qualquer necessidade de alteração no código HTML/TypeScript:
- **Sala 1:**
  ```json
  {
    "roomId": "sala_1",
    "sensorId": "sensor1",
    "temperature": 22.4,
    "humidity": 50.2,
    "timestamp": 1776445504000,
    "sensorStatus": "online",
    "origem": "pythonanywhere_sync"
  }
  ```
- **Sala 2:**
  ```json
  {
    "roomId": "sala_2",
    "sensorId": "sensor2",
    "temperature": 21.8,
    "humidity": 46.5,
    "timestamp": 1776445504000,
    "sensorStatus": "online",
    "origem": "pythonanywhere_sync"
  }
  ```

---

## 🛠 Diagnóstico e Resolução de Problemas

| Sintoma | Causa Mais Provável | Solução |
| :--- | :--- | :--- |
| `FileNotFoundError: serviceAccountKey.json` | O arquivo de credenciais do Firebase não foi enviado para a pasta do script. | Baixe a chave no Console do Firebase (Passo 1) e salve como `serviceAccountKey.json` na mesma pasta do script. |
| `ConnectionError` ou `ProxyError` | Contas gratuitas do PythonAnywhere exigem que conexões externas passem pelo proxy padrão. | O script e o `requests` já utilizam automaticamente as variáveis `http_proxy` e `https_proxy` configuradas pelo PythonAnywhere. Verifique se o domínio do Firebase (`*.firebaseio.com`, `firestore.googleapis.com`) está acessível. |
| Valores lidos aparecem como `0.0` | O nó no Realtime Database ainda não recebeu dados de sensores físicos. | Execute `python simulate_sensors.py` para injetar valores simulados ou conecte seu dispositivo IoT / ESP32. |
| Erro de permissão no Firestore | A conta de serviço não tem permissão no projeto. | Certifique-se de que a conta de serviço gerada pertence ao projeto `gemini-project---analise-5f616`. O Admin SDK tem permissão total por padrão. |
