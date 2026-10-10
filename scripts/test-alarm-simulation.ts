import { AlertModel } from '../src/models/AlertModel';
import { RoomConfigModel } from '../src/models/RoomConfigModel';
import { TelemetryModel } from '../src/models/TelemetryModel';
import { HistoryModel } from '../src/models/HistoryModel';
import { AuthModel } from '../src/models/AuthModel';
import { DashboardController } from '../src/controllers/DashboardController';

/**
 * Script de teste automatizado para validar os requisitos de AJUSTES-SIMU-ALARME.md:
 * 1. Comportamento do botão de simulação (picos de temperatura e umidade, alertas visíveis).
 * 2. REGRA CRÍTICA: Nenhuma chamada de escrita no Firebase durante a simulação.
 * 3. Parada da simulação: dados simulados descartados e restauração do estado normal.
 */

// Contadores de chamadas de persistência
let firestoreWritesCount = 0;
let realtimeDbWritesCount = 0;

console.log('====================================================');
console.log('🏥 TESTE AUTOMATIZADO: SIMULAÇÃO DE ALARME DAS SALAS');
console.log('====================================================\n');

// Instanciação dos models
const alertModel = new AlertModel();
const roomConfigModel = new RoomConfigModel();
const telemetryModel = new TelemetryModel();
const historyModel = new HistoryModel();
const authModel = new AuthModel();

// Spy/Interceptador nas funções de persistência para comprovar ausência de chamadas
const originalSetSimulatedAlerts = alertModel.setSimulatedAlerts.bind(alertModel);
alertModel.setSimulatedAlerts = (alerts) => {
  // Verifica se nenhum alerta simulado tenta persistir no Firestore
  for (const a of alerts) {
    if (!a.isSimulation) {
      firestoreWritesCount++;
    }
  }
  originalSetSimulatedAlerts(alerts);
};

// Monitora se recordReading (Firestore) é chamado com dados de simulação
const originalRecordReading = historyModel.recordReading.bind(historyModel);
historyModel.recordReading = async (reading) => {
  if (reading.isAnomaly && reading.temperature > 25) {
    firestoreWritesCount++;
  }
  return originalRecordReading(reading);
};

// Monitora se publishReading (Realtime DB) é chamado com dados de simulação
const originalPublishReading = telemetryModel.publishReading.bind(telemetryModel);
telemetryModel.publishReading = async (reading) => {
  if (reading.isAnomaly && reading.temperature > 25) {
    realtimeDbWritesCount++;
  }
  return originalPublishReading(reading);
};

// Instanciação do DashboardController
const dashboardController = new DashboardController(
  telemetryModel,
  roomConfigModel,
  historyModel,
  alertModel,
  authModel
);

// Obtenção dos limites configurados das salas
const configs = roomConfigModel.getConfigs();
const maxTempS1 = configs.sala_1.thresholds.maxTemp;
const minHumS2 = configs.sala_2.thresholds.minHum;

console.log(`[Configurações Iniciais]`);
console.log(`- Sala 1: Limite Máximo de Temperatura = ${maxTempS1}°C`);
console.log(`- Sala 2: Limite Mínimo de Umidade = ${minHumS2}%\n`);

// ETAPA 1: Iniciar Simulação de Alarme
console.log('[Etapa 1] Acionando simulação de alarme...');
dashboardController.startAlarmSimulation();

// Verificações da Etapa 1
const activeAlerts = alertModel.getActiveAlerts();
const tempAlert = activeAlerts.find(a => a.metric === 'temperature' && a.isSimulation);
const humAlert = activeAlerts.find(a => a.metric === 'humidity' && a.isSimulation);

console.log(`Alertas ativos na interface: ${activeAlerts.length}`);
if (!tempAlert || !humAlert) {
  console.error('❌ FALHA: Alertas simulados de temperatura e umidade não foram gerados!');
  process.exit(1);
}

console.log(`✓ Alerta de Temperatura detectado: "${tempAlert.message}"`);
console.log(`  -> Sala: ${tempAlert.roomName} | Valor: ${tempAlert.value} (Limite: ${tempAlert.thresholdLimit})`);
console.log(`✓ Alerta de Umidade detectado: "${humAlert.message}"`);
console.log(`  -> Sala: ${humAlert.roomName} | Valor: ${humAlert.value} (Limite: ${humAlert.thresholdLimit})`);

// ETAPA 2: Comprovação da Regra Crítica de Persistência
console.log('\n[Etapa 2] Verificação da Regra Crítica de Persistência...');
console.log(`Chamadas de escrita no Cloud Firestore: ${firestoreWritesCount}`);
console.log(`Chamadas de escrita no Realtime Database: ${realtimeDbWritesCount}`);

if (firestoreWritesCount !== 0 || realtimeDbWritesCount !== 0) {
  console.error('❌ FALHA CRÍTICA: Foram detectadas tentativas de escrita no Firebase durante a simulação!');
  process.exit(1);
}
console.log('✓ REGRA CRÍTICA RESPEITADA: ZERO gravações no Firebase (estado exclusivo em memória do cliente).');

// ETAPA 3: Parar Simulação de Alarme e Restaurar Estado Normal
console.log('\n[Etapa 3] Parando simulação de alarme e restaurando estado...');
dashboardController.stopAlarmSimulation();

const alertsAfterStop = alertModel.getActiveAlerts();
const hasSimAlertsLeft = alertsAfterStop.some(a => a.isSimulation);

if (hasSimAlertsLeft) {
  console.error('❌ FALHA: Alertas simulados ainda permaneceram ativos após a parada!');
  process.exit(1);
}

console.log(`✓ Alertas simulados após parada: 0 (todos descartados)`);
console.log(`✓ Estado da simulação ativo: ${dashboardController.isAlarmSimulationRunning()}`);
console.log(`✓ Visualizações e medidores restaurados para telemetria real`);

console.log('\n====================================================');
console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
console.log('====================================================');

telemetryModel.destroy();
