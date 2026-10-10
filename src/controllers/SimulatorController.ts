import { TelemetryModel } from '../models/TelemetryModel';
import { HistoryModel } from '../models/HistoryModel';
import { SimulatorControlView } from '../views/SimulatorControlView';
import { SensorReading } from '../types';

/**
 * Controller do Simulador de Sensores IoT.
 * Coordena a geração de telemetria contínua, ingestão no Realtime Database
 * e persistência histórica no Cloud Firestore, além de injeção de falhas para testes.
 */
export class SimulatorController {
  private telemetryModel: TelemetryModel;
  private historyModel: HistoryModel;
  private view: SimulatorControlView | null = null;

  private isRunning = false;
  private packetCount = 0;
  private intervalTimer: number | null = null;

  // Modos de injeção de teste
  private overrideS1Temp: number | null = null;
  private overrideS2Hum: number | null = null;
  private pauseS1 = false;

  constructor(telemetryModel: TelemetryModel, historyModel: HistoryModel) {
    this.telemetryModel = telemetryModel;
    this.historyModel = historyModel;
    // Inicia pausado para exibir os dados reais do Firebase Realtime Database (/ambiente)
  }

  public setView(view: SimulatorControlView): void {
    this.view = view;
    this.view.render(this.isRunning, this.packetCount);
  }

  public toggleActive(): void {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
    this.view?.render(this.isRunning, this.packetCount);
  }

  public injectAnomaly(type: 'high_temp_s1' | 'low_temp_s1' | 'high_hum_s2' | 'offline_s1' | 'reset'): void {
    if (type === 'high_temp_s1') {
      this.overrideS1Temp = 26.8; // Excede limite máximo (23°C)
      this.pauseS1 = false;
    } else if (type === 'low_temp_s1') {
      this.overrideS1Temp = 17.2; // Abaixo do limite mínimo (19°C)
      this.pauseS1 = false;
    } else if (type === 'high_hum_s2') {
      this.overrideS2Hum = 72.5; // Excede limite máximo (60%)
    } else if (type === 'offline_s1') {
      this.pauseS1 = true; // Cessa transmissões para disparar heartbeat timeout (>15s)
    } else if (type === 'reset') {
      this.overrideS1Temp = null;
      this.overrideS2Hum = null;
      this.pauseS1 = false;
    }

    // Força emissão imediata
    this.tick();
  }

  private startSimulation(): void {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    // Intervalo de transmissão IoT a cada 3.5 segundos
    this.intervalTimer = window.setInterval(() => this.tick(), 3500);
  }

  private stopSimulation(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private tick(): void {
    if (!this.isRunning) return;

    const now = Date.now();

    // 1. Telemetria Sala 1 (Diagnóstico por Imagem)
    if (!this.pauseS1) {
      // Variação browniana realista ao redor de 21.0°C e 48%
      const jitterT = (Math.random() - 0.5) * 0.4;
      const jitterH = (Math.random() - 0.5) * 1.2;

      const temp1 = this.overrideS1Temp !== null ? this.overrideS1Temp : Number((21.2 + jitterT).toFixed(1));
      const hum1 = Number((48.0 + jitterH).toFixed(1));

      const reading1: SensorReading = {
        roomId: 'sala_1',
        temperature: temp1,
        humidity: hum1,
        timestamp: now,
        sensorStatus: 'online'
      };

      this.telemetryModel.publishReading(reading1);
      this.historyModel.recordReading(reading1);
      this.packetCount++;
    }

    // 2. Telemetria Sala 2 (Suporte à Vida)
    const jitterT2 = (Math.random() - 0.5) * 0.5;
    const jitterH2 = (Math.random() - 0.5) * 1.5;

    const temp2 = Number((22.0 + jitterT2).toFixed(1));
    const hum2 = this.overrideS2Hum !== null ? this.overrideS2Hum : Number((45.0 + jitterH2).toFixed(1));

    const reading2: SensorReading = {
      roomId: 'sala_2',
      temperature: temp2,
      humidity: hum2,
      timestamp: now,
      sensorStatus: 'online'
    };

    this.telemetryModel.publishReading(reading2);
    this.historyModel.recordReading(reading2);
    this.packetCount++;

    this.view?.render(this.isRunning, this.packetCount);
  }

  public destroy(): void {
    this.stopSimulation();
  }
}
