import './style.css';
import { registerSW } from 'virtual:pwa-register';

import { AuthModel } from './models/AuthModel';
import { RoomConfigModel } from './models/RoomConfigModel';
import { TelemetryModel } from './models/TelemetryModel';
import { HistoryModel } from './models/HistoryModel';
import { AlertModel } from './models/AlertModel';

import { AuthController } from './controllers/AuthController';
import { SettingsController } from './controllers/SettingsController';
import { SimulatorController } from './controllers/SimulatorController';
import { DashboardController } from './controllers/DashboardController';

import { NavbarView } from './views/NavbarView';
import { AlertsBannerView } from './views/AlertsBannerView';
import { TelemetryGaugesView } from './views/TelemetryGaugesView';
import { StatisticsView } from './views/StatisticsView';
import { ChartsView } from './views/ChartsView';
import { RoomConfigModalView } from './views/RoomConfigModalView';
import { AuthModalView } from './views/AuthModalView';
import { SimulatorControlView } from './views/SimulatorControlView';

/**
 * Ponto de Entrada da Aplicação (Bootstrap MVC).
 * Inicializa os modelos, controladores, componentes visuais e Service Worker PWA.
 */

// Registro automático do Service Worker do PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[PWA] Nova versão disponível. Atualizando automaticamente...');
  },
  onOfflineReady() {
    console.info('[PWA] Aplicação pronta para operação offline.');
  }
});

// Suporte para instalação PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Montagem da interface raiz
const appRoot = document.getElementById('app');
if (!appRoot) {
  throw new Error('Elemento raiz #app não encontrado no DOM');
}

appRoot.innerHTML = `
  <div id="navbar-container"></div>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
    <div id="alerts-container"></div>
    <div id="simulator-container"></div>
    <div id="gauges-container"></div>
    <div id="charts-container"></div>
    <div id="stats-container"></div>
  </main>
  <footer class="border-t border-slate-800 bg-[#0B0F17] py-6 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>MedTrack IoT © ${new Date().getFullYear()} • Hospital de Clínicas e Equipamentos Médicos</p>
      <p class="font-mono text-[11px] text-slate-400">Firebase Auth • Firestore • Realtime Database • PWA Offline</p>
    </div>
  </footer>
  <div id="modal-container"></div>
`;

// Elementos contêineres
const navbarContainer = document.getElementById('navbar-container')!;
const alertsContainer = document.getElementById('alerts-container')!;
const simulatorContainer = document.getElementById('simulator-container')!;
const gaugesContainer = document.getElementById('gauges-container')!;
const chartsContainer = document.getElementById('charts-container')!;
const statsContainer = document.getElementById('stats-container')!;
const modalContainer = document.getElementById('modal-container')!;

// 1. Instanciação dos Modelos (Camada Model)
const authModel = new AuthModel();
const roomConfigModel = new RoomConfigModel();
const telemetryModel = new TelemetryModel();
const historyModel = new HistoryModel();
const alertModel = new AlertModel();

// 2. Instanciação dos Controladores (Camada Controller)
const authController = new AuthController(authModel);
const settingsController = new SettingsController(roomConfigModel, authModel);
const simulatorController = new SimulatorController(telemetryModel, historyModel);
const dashboardController = new DashboardController(
  telemetryModel,
  roomConfigModel,
  historyModel,
  alertModel,
  authModel
);

// 3. Instanciação dos Modais
const authModalView = new AuthModalView(modalContainer, {
  onLogin: async (email, pass) => authController.handleLogin(email, pass),
  onRegister: async (email, pass, role) => authController.handleRegister(email, pass, role),
  onQuickDemoLogin: (role) => authController.handleSwitchRole(role),
  onClose: () => {}
});
authController.setModalView(authModalView);

const roomConfigModalView = new RoomConfigModalView(modalContainer, {
  onSave: async (config, newThresholds) => settingsController.handleSaveThresholds(config, newThresholds),
  onClose: () => {}
});
settingsController.setModalView(roomConfigModalView);

// 4. Instanciação das Visualizações Principais (Camada View)
const navbarView = new NavbarView(navbarContainer, {
  onOpenAuth: () => authController.openAuthModal(),
  onLogout: () => authController.handleLogout(),
  onSwitchRole: (role) => authController.handleSwitchRole(role),
  onInstallPwa: async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        navbarView.setInstallPromptAvailable(false);
      }
      deferredPrompt = null;
    }
  }
});

const alertsBannerView = new AlertsBannerView(alertsContainer, {
  onDismissAlert: (id) => dashboardController.handleDismissAlert(id)
});

const telemetryGaugesView = new TelemetryGaugesView(gaugesContainer, {
  onOpenConfigModal: (roomId) => settingsController.openConfigModal(roomId)
});

const statisticsView = new StatisticsView(statsContainer, {
  onChangeSampleSize: (size) => dashboardController.handleSampleSizeChange(size)
});

const chartsView = new ChartsView(chartsContainer, {
  onToggleMetric: () => {}
});
chartsView.render();

const simulatorControlView = new SimulatorControlView(simulatorContainer, {
  onToggleActive: () => simulatorController.toggleActive(),
  onInjectAnomaly: (type) => simulatorController.injectAnomaly(type),
  onToggleAlarmSimulation: () => dashboardController.toggleAlarmSimulation()
});
simulatorController.setView(simulatorControlView);
dashboardController.setSimulatorView(simulatorControlView);

// 5. Vinculação das visualizações ao DashboardController
dashboardController.setViews(
  navbarView,
  alertsBannerView,
  telemetryGaugesView,
  statisticsView,
  chartsView
);

// Eventos PWA e conectividade
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  navbarView.setInstallPromptAvailable(true);
});

window.addEventListener('online', () => {
  dashboardController.updateAllViews();
});

window.addEventListener('offline', () => {
  dashboardController.updateAllViews();
});
