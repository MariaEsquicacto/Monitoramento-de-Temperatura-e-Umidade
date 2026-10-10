import { doc, setDoc } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../config/firebase';
import { AlertItem, RoomConfig, RoomId, SensorReading } from '../types';
import { formatTemperature, formatHumidity } from '../utils/formatters';
import { playAlertBeep } from '../utils/audio';

/**
 * Model para Detecção, Gerenciamento e Persistência de Alertas Hospitalares.
 * Atende ao Requisito 3 (identificação imediata de anomalias com exibição destacada)
 * e ao Requisito não-funcional de perda de conexão de sensores.
 */
export class AlertModel {
  private activeAlerts: Map<string, AlertItem> = new Map();
  private simulatedAlerts: AlertItem[] = [];
  private alertLog: AlertItem[] = [];
  private listeners: Array<(alerts: AlertItem[]) => void> = [];

  constructor() {
    // Inicia vazio
  }

  /**
   * Define alertas simulados mantidos estritamente na memória do cliente.
   * Não dispara nenhuma persistência no Firestore.
   */
  public setSimulatedAlerts(alerts: AlertItem[]): void {
    this.simulatedAlerts = alerts.map(a => ({ ...a, isSimulation: true }));
    playAlertBeep();
    this.notify();
  }

  /**
   * Remove todos os alertas simulados da memória e restaura o estado normal.
   */
  public clearSimulatedAlerts(): void {
    this.simulatedAlerts = [];
    this.notify();
  }

  /**
   * Avalia as leituras correntes em relação às faixas operacionais configuradas.
   */
  public evaluateReadings(
    readings: Record<RoomId, SensorReading | null>,
    configs: Record<RoomId, RoomConfig>
  ): void {
    const roomIds: RoomId[] = ['sala_1', 'sala_2'];
    let hasNewAnomaly = false;

    for (const roomId of roomIds) {
      const reading = readings[roomId];
      const config = configs[roomId];
      if (!reading || !config) continue;

      // 1. Verificação de Sensor Offline
      const offlineAlertKey = `${roomId}-offline`;
      if (reading.sensorStatus === 'offline') {
        if (!this.activeAlerts.has(offlineAlertKey)) {
          const alert: AlertItem = {
            id: offlineAlertKey,
            roomId,
            roomName: config.roomName,
            metric: 'sensor_offline',
            metricLabel: 'Comunicação do Sensor',
            value: 'Sem sinal (>15s)',
            thresholdLimit: 'Heartbeat contínuo',
            message: `Sensor da ${config.roomName} parou de transmitir dados! Verifique a integridade do hardware.`,
            severity: 'critical',
            timestamp: Date.now()
          };
          this.activeAlerts.set(offlineAlertKey, alert);
          this.recordAlert(alert);
          hasNewAnomaly = true;
        }
      } else {
        // Se voltou a ficar online, remove alerta de offline
        if (this.activeAlerts.has(offlineAlertKey)) {
          this.activeAlerts.delete(offlineAlertKey);
        }
      }

      // Se o sensor estiver offline, não avalia temperatura/umidade antigas
      if (reading.sensorStatus === 'offline') continue;

      // 2. Verificação de Limites de Temperatura
      const tempAlertKey = `${roomId}-temp`;
      const { minTemp, maxTemp, minHum, maxHum } = config.thresholds;

      if (reading.temperature < minTemp || reading.temperature > maxTemp) {
        const isHigh = reading.temperature > maxTemp;
        const alert: AlertItem = {
          id: tempAlertKey,
          roomId,
          roomName: config.roomName,
          metric: 'temperature',
          metricLabel: 'Temperatura',
          value: formatTemperature(reading.temperature),
          thresholdLimit: `Faixa permitida: ${minTemp.toFixed(1)}°C a ${maxTemp.toFixed(1)}°C`,
          message: `Temperatura ${isHigh ? 'ACIMA DO LIMITE MÁXIMO' : 'ABAIXO DO LIMITE MÍNIMO'} na ${config.roomName}! Risco de dano térmico aos equipamentos.`,
          severity: 'critical',
          timestamp: Date.now()
        };

        if (!this.activeAlerts.has(tempAlertKey)) {
          hasNewAnomaly = true;
          this.recordAlert(alert);
        }
        this.activeAlerts.set(tempAlertKey, alert);
      } else {
        if (this.activeAlerts.has(tempAlertKey)) {
          this.activeAlerts.delete(tempAlertKey);
        }
      }

      // 3. Verificação de Limites de Umidade
      const humAlertKey = `${roomId}-hum`;
      if (reading.humidity < minHum || reading.humidity > maxHum) {
        const isHigh = reading.humidity > maxHum;
        const alert: AlertItem = {
          id: humAlertKey,
          roomId,
          roomName: config.roomName,
          metric: 'humidity',
          metricLabel: 'Umidade Relativa',
          value: formatHumidity(reading.humidity),
          thresholdLimit: `Faixa permitida: ${minHum.toFixed(1)}% a ${maxHum.toFixed(1)}%`,
          message: `Umidade ${isHigh ? 'ELEVADA (risco de condensação)' : 'MUITO BAIXA (risco de ESD)'} na ${config.roomName}!`,
          severity: 'warning',
          timestamp: Date.now()
        };

        if (!this.activeAlerts.has(humAlertKey)) {
          hasNewAnomaly = true;
          this.recordAlert(alert);
        }
        this.activeAlerts.set(humAlertKey, alert);
      } else {
        if (this.activeAlerts.has(humAlertKey)) {
          this.activeAlerts.delete(humAlertKey);
        }
      }
    }

    if (hasNewAnomaly) {
      playAlertBeep();
    }

    this.notify();
  }

  private async recordAlert(alert: AlertItem): Promise<void> {
    // REGRA CRÍTICA: Se for alerta de simulação, NUNCA grava no Firestore
    if (alert.isSimulation) {
      return;
    }

    this.alertLog.unshift(alert);
    if (this.alertLog.length > 50) {
      this.alertLog.pop();
    }

    // Persistência no Firestore
    if (isFirebaseConfigured() && firestore) {
      try {
        const alertDocRef = doc(firestore, 'alerts', `${alert.id}-${Date.now()}`);
        await setDoc(alertDocRef, alert);
      } catch (err) {
        console.warn('[AlertModel] Erro ao registrar alerta no Firestore:', err);
      }
    }
  }

  public getActiveAlerts(): AlertItem[] {
    return [...this.simulatedAlerts, ...Array.from(this.activeAlerts.values())];
  }

  public dismissAlert(alertId: string): void {
    this.simulatedAlerts = this.simulatedAlerts.filter(a => a.id !== alertId);
    this.activeAlerts.delete(alertId);
    this.notify();
  }

  public subscribe(listener: (alerts: AlertItem[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getActiveAlerts());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const list = this.getActiveAlerts();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}
