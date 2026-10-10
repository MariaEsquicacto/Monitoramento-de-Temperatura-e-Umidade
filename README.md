# 🏥 MedTrack IoT — Monitoramento Hospitalar de Telemetria em Tempo Real

Aplicação web progressiva (PWA) de nível hospitalar para monitoramento contínuo de **temperatura** e **umidade** em salas de equipamentos médicos de alta sensibilidade (ex.: Tomografia Computadorizada, Ressonância Magnética e Unidades de Suporte à Vida / Centro Cirúrgico).

Desenvolvida com **TypeScript**, **Vite**, **Tailwind CSS**, arquitetura **MVC** (Model-View-Controller) e integração completa com o ecossistema **Firebase** (Authentication, Cloud Firestore, Realtime Database e Hosting).

---

## 📋 Sumário
1. [Visão Geral e Contexto](#-visão-geral-e-contexto)
2. [Arquitetura de Software (MVC)](#-arquitetura-de-software-mvc)
3. [Justificativa Técnica dos Bancos de Dados](#-justificativa-técnica-dos-bancos-de-dados)
4. [Faixas Operacionais e Justificativas Médicas](#-faixas-operacionais-e-justificativas-médicas)
5. [Controle de Acesso e Segurança (RBAC)](#-controle-de-acesso-e-segurança-rbac)
6. [Recursos de Resiliência e IoT](#-recursos-de-resiliência-e-iot)
7. [Instalação e Execução Local](#-instalação-e-execução-local)
8. [Configuração das Variáveis de Ambiente](#-configuração-das-variáveis-de-ambiente)
9. [Instruções de Deploy no Firebase Hosting](#-instruções-de-deploy-no-firebase-hosting)
10. [Estrutura de Pastas do Projeto](#-estrutura-de-pastas-do-projeto)

---

## 🎯 Visão Geral e Contexto

Ambientes hospitalares que abrigam equipamentos médicos críticos exigem climatização rigorosa:
* **Sala 1 (Diagnóstico por Imagem):** abriga tomógrafos e ressonâncias magnéticas cujos detectores semicondutores e computadores de reconstrução de imagens sofrem descalibração ou colapso com variações térmicas súbitas.
* **Sala 2 (Suporte à Vida e Materiais Estéreis):** abriga ventiladores pulmonares, bombas de infusão e embalagens estéreis que exigem controle rigoroso de umidade para evitar proliferação bacteriana ou perda de integridade das barreiras estéreis.

O **MedTrack IoT** coleta dados em tempo real dos sensores, identifica anomalias instantaneamente, calcula indicadores estatísticos de estabilidade e notifica a equipe com alertas sonoros e visuais destacados.

---

## 🏛 Arquitetura de Software (MVC)

A aplicação foi rigorosamente projetada no padrão **Model-View-Controller**:

```
src/
├── models/         # Camada Model: Isolamento da persistência e estado de dados
│   ├── AuthModel.ts         -> Gestão de sessão Firebase Auth e perfis no Firestore
│   ├── TelemetryModel.ts    -> Streaming WebSocket via Firebase Realtime Database e Heartbeat
│   ├── RoomConfigModel.ts   -> Faixas operacionais parametrizáveis via Cloud Firestore
│   ├── HistoryModel.ts      -> Histórico estruturado para séries temporais via Cloud Firestore
│   └── AlertModel.ts        -> Identificação de anomalias e persistência de alertas
├── views/          # Camada View: Componentes visuais responsivos (sem regras de negócio)
│   ├── NavbarView.ts        -> Cabeçalho, status PWA/rede e identificação de perfil
│   ├── AlertsBannerView.ts  -> Alertas destacados de anomalias por sala e grandeza
│   ├── TelemetryGaugesView.ts -> Medidores visuais em tempo real e status de conexão
│   ├── StatisticsView.ts    -> Tabela de indicadores estatísticos (x̄, Md, s)
│   ├── ChartsView.ts        -> Gráficos ao vivo e históricos com Chart.js e faixas limites
│   ├── RoomConfigModalView.ts -> Modal de parametrização de limites (restrito a Admin)
│   ├── AuthModalView.ts     -> Modal de autenticação (Login, Cadastro e Switch Demo)
│   └── SimulatorControlView.ts -> Painel de injeção de testes IoT
└── controllers/    # Camada Controller: Orquestração e coordenação
    ├── AuthController.ts       -> Coordena login, cadastro, logout e papéis
    ├── SettingsController.ts   -> Valida permissões de Admin e atualiza faixas operacionais
    ├── SimulatorController.ts  -> Emite leituras a cada 3.5s e injeta anomalias para teste
    └── DashboardController.ts  -> Orquestrador mestre entre Models, Views e Cálculos
```

---

## ⚖ Justificativa Técnica dos Bancos de Dados

O projeto combina **dois bancos de dados do Firebase**, aproveitando os pontos fortes de cada arquitetura:

| Critério | Firebase Realtime Database | Cloud Firestore |
| :--- | :--- | :--- |
| **Entidades Alocadas** | Leituras instantâneas dos sensores (`/rooms/{id}/current`) e sinal de Heartbeat (`/rooms/{id}/heartbeat`). | Configurações de faixas (`/room_configs/{id}`), histórico de leituras (`/readings_history`), perfis de usuário (`/users`) e alertas (`/alerts`). |
| **Protocolo de Rede** | Conexão **WebSocket persistente** de mão dupla. | Chamadas HTTP/2 gRPC com modelo de documentos e coleções. |
| **Latência** | **Ultrabaixa (< 100 ms)** — ideal para fluxos contínuos de IoT. | Baixa a moderada (~200–400 ms). |
| **Modelo de Dados** | Árvore única JSON leve, otimizada para pub/sub veloz. | Documentos tipados, coleções e subcoleções ricas. |
| **Consultas e Índices** | Consultas simples com ordenação em chave única. | Consultas complexas, filtros compostos (`roomId` + `timestamp`), ordenação e paginação. |
| **Modelo de Custos** | Cobrado por volume de dados trafegados (GB). Econômico para muitas atualizações pequenas. | Cobrado por contagem de leituras/escritas de documentos. |

---

## 🌡 Faixas Operacionais e Justificativas Médicas

Os parâmetros padrão foram adotados em conformidade com as normas **ABNT NBR 7256** (*Tratamento de ar em estabelecimentos assistenciais de saúde*) e **ASHRAE Standard 170** (*Ventilation of Health Care Facilities*):

### 1. Sala 1: Diagnóstico por Imagem (Tomografia Computadorizada e Ressonância Magnética)
* **Temperatura:** `19,0 °C` a `23,0 °C` (Padrão: 21,0 °C)
  * *Justificativa:* Os anéis de detectores semicondutores de tomógrafos geram elevado calor e sofrem drift térmico (derivação de calibração eletrônica) acima de 23 °C. Abaixo de 19 °C, pode ocorrer choque térmico em componentes mecânicos de rotação e bobinas criogênicas.
* **Umidade Relativa:** `40,0 %` a `60,0 %` (Padrão: 48,0 %)
  * *Justificativa:* Umidade abaixo de 40% aumenta drasticamente o risco de descargas eletrostáticas (ESD) em componentes digitais sensíveis. Acima de 60%, ocorre risco iminente de condensação nas lentes e guias de onda ópticos.

### 2. Sala 2: Suporte à Vida e Materiais Estéreis (UTI / Centro Cirúrgico)
* **Temperatura:** `20,0 °C` a `24,0 °C` (Padrão: 22,0 °C)
  * *Justificativa:* Manter a temperatura estável previne a hipotermia de pacientes em pós-operatório ou em uso de ventiladores mecânicos, além de assegurar o funcionamento dos circuitos eletrônicos das bombas de infusão.
* **Umidade Relativa:** `35,0 %` a `60,0 %` (Padrão: 45,0 %)
  * *Justificativa:* Evita o ressecamento ou a saturação por umidade das embalagens de barreira estéril (papel grau cirúrgico), impedindo a proliferação bacteriana e de fungos.

---

## 🔒 Controle de Acesso e Segurança (RBAC)

O sistema define dois níveis estritos de usuário:
1. **Administrador (`admin`):** Acesso completo à visualização, gráficos, histórico, estatísticas e **permissão exclusiva para alterar os limites operacionais** de temperatura e umidade.
2. **Usuário Comum (`viewer`):** Permissão **estritamente de visualização (somente leitura)**. Na interface, os formulários são desabilitados.

### Regras de Segurança do Cloud Firestore (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }

    // Configurações das faixas operacionais: alteração exclusiva do Administrador
    match /room_configs/{roomId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // Histórico de leituras e alertas
    match /readings_history/{readingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }

    match /alerts/{alertId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }
  }
}
```

### Regras do Realtime Database (`database.rules.json`)
```json
{
  "rules": {
    ".read": "auth != null",
    "rooms": {
      "$roomId": {
        "current": {
          ".read": "auth != null",
          ".write": "auth != null",
          ".validate": "newData.hasChildren(['temperature', 'humidity', 'timestamp'])"
        },
        "heartbeat": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## 📡 Recursos de Resiliência e IoT

* **Detecção de Sensor Offline (Heartbeat Watcher):** O sistema monitora o intervalo da última leitura a cada 3 segundos. Se um sensor parar de transmitir por mais de **15 segundos**, a interface dispara imediatamente o alerta: `Sensor OFFLINE: Perda de comunicação`.
* **Cálculos Estatísticos Automatizados (Requisito 4):**
  * **Média Aritmética ($\bar{x}$):** $\bar{x} = \frac{1}{n} \sum_{i=1}^n x_i$
  * **Mediana ($Md$):** Valor central da série ordenada (ou média dos centrais).
  * **Desvio Padrão Amostral ($s$):** $s = \sqrt{\frac{\sum (x_i - \bar{x})^2}{n - 1}}$ (indica a estabilidade térmica e dispersão).
* **Simulador de Sensores Integrado:** Permite testar todo o ecossistema sem hardware físico, com botões de injeção imediata de:
  * Sobreaquecimento na Sala 1 (26,8 °C);
  * Queda de temperatura na Sala 1 (17,2 °C);
  * Alta umidade na Sala 2 (72,5 %);
  * Desconexão do sensor da Sala 1 (validação do heartbeat).
* **Modo PWA Offline:** Suporte a cache com service worker (`sw.js`), instalação como aplicativo na área de trabalho ou celular e indicador de status de rede.

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
* Node.js v18+ (recomendado v20 ou v22)
* NPM v9+

### Passo a passo
1. Clone ou acerte o diretório do projeto:
```powershell
cd "d:\Projeto SENAI"
```

2. Instale as dependências:
```powershell
npm.cmd install
```

3. Crie o arquivo de variáveis de ambiente com base no exemplo:
```powershell
copy .env.example .env
```
*(Se você não preencher as credenciais reais no `.env`, a aplicação iniciará graciosamente em **Modo Demonstração Local**, totalmente funcional para testes e validação).*

4. Inicie o servidor de desenvolvimento:
```powershell
npm.cmd run dev
```
Acesse no navegador: `http://localhost:3000/`

5. Para validar a compilação TypeScript e o build de produção:
```powershell
npm.cmd run build
```

6. Para executar o teste automatizado da **Simulação de Alarme** (validação de picos, alertas e zero gravação no Firebase):
```powershell
npm.cmd run test:alarm
```

---

## 🔑 Configuração das Variáveis de Ambiente

No arquivo `.env`, preencha os dados obtidos no console do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=sua-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ **Aviso de Segurança:** O arquivo `.env` está explicitamente incluído no `.gitignore` para garantir que nenhuma chave confidencial seja commitada no repositório.

---

## 🌐 Instruções de Deploy no Firebase Hosting

*(Conforme as regras do projeto, **o deploy não foi executado** e só deve ser acionado mediante sua autorização explícita).*

Caso deseje publicar a aplicação na nuvem do Google Firebase Hosting, siga o procedimento abaixo:

### 1. Instalar a CLI do Firebase (se ainda não tiver instalada)
```powershell
npm.cmd install -g firebase-tools
```

### 2. Autenticar no Google
```powershell
firebase login
```

### 3. Vincular o projeto existente
```powershell
firebase use --add seu-projeto-id
```

### 4. Gerar o pacote otimizado de produção
```powershell
npm.cmd run build
```
O build compilará o código TypeScript e gerará os arquivos estáticos, o manifesto PWA e o Service Worker no diretório `dist/`.

### 5. Publicar no Firebase
```powershell
firebase deploy --only hosting,firestore:rules,database
```

A CLI fornecerá a URL pública de acesso (exemplo: `https://seu-projeto.web.app`).

---

## 📁 Estrutura de Pastas do Projeto

```
d:\Projeto SENAI/
├── public/
│   ├── favicon.svg              # Ícone SVG de alta resolução
│   ├── apple-touch-icon.png     # Ícone para dispositivos iOS
│   └── icons/
│       ├── icon-192x192.png     # Ícone PWA 192px
│       └── icon-512x512.png     # Ícone PWA 512px
├── src/
│   ├── config/
│   │   ├── constants.ts         # Faixas operacionais padrão e justificativas
│   │   └── firebase.ts          # Inicialização e detecção do Firebase
│   ├── controllers/
│   │   ├── AuthController.ts       # Controle de sessão e permissões
│   │   ├── DashboardController.ts  # Orquestração mestre MVC
│   │   ├── SettingsController.ts   # Atualização de limites pelo Administrador
│   │   └── SimulatorController.ts  # Gerador de telemetria IoT simulada
│   ├── models/
│   │   ├── AlertModel.ts        # Detecção e persistência de anomalias
│   │   ├── AuthModel.ts         # Firebase Auth e papéis RBAC
│   │   ├── HistoryModel.ts      # Cloud Firestore: séries temporais
│   │   ├── RoomConfigModel.ts   # Cloud Firestore: faixas das salas
│   │   └── TelemetryModel.ts    # Firebase Realtime Database: ao vivo
│   ├── types/
│   │   └── index.ts             # Interfaces TypeScript completas
│   ├── utils/
│   │   ├── audio.ts             # Sintetizador Web Audio para alerta sonoro
│   │   ├── formatters.ts        # Formatadores pt-BR
│   │   └── statistics.ts        # Média, Mediana e Desvio Padrão
│   ├── views/
│   │   ├── AlertsBannerView.ts  # Alertas destacados imediatos
│   │   ├── AuthModalView.ts     # Modal de autenticação
│   │   ├── ChartsView.ts        # Gráficos Chart.js (Live e Histórico)
│   │   ├── NavbarView.ts        # Cabeçalho com status PWA e perfil
│   │   ├── RoomConfigModalView.ts # Parametrização das salas
│   │   ├── SimulatorControlView.ts# Painel de controle do simulador
│   │   ├── StatisticsView.ts    # Tabela estatística comparativa
│   │   └── TelemetryGaugesView.ts # Medidores das salas em tempo real
│   ├── main.ts                  # Ponto de entrada MVC e PWA
│   ├── style.css                # Tailwind CSS e estilos customizados
│   └── vite-env.d.ts            # Tipagens globais do Vite e PWA
├── .env.example                 # Exemplo seguro das variáveis de ambiente
├── .gitignore                   # Proteção contra commit de segredos
├── database.rules.json          # Regras de segurança do Realtime Database
├── firebase.json                # Configurações de deploy do Firebase
├── firestore.rules              # Regras de segurança RBAC do Cloud Firestore
├── index.html                   # Documento HTML raiz com SEO e PWA
├── package.json                 # Dependências e scripts npm
├── postcss.config.js            # Configuração PostCSS
├── tailwind.config.js           # Tema e tokens Tailwind CSS
├── tsconfig.json                # Configuração estrita do TypeScript
└── vite.config.ts               # Bundler Vite e plugin VitePWA
```
