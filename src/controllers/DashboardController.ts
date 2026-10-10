import { TelemetryModel } from '../models/TelemetryModel';
import { RoomConfigModel } from '../models/RoomConfigModel';
import { HistoryModel } from '../models/HistoryModel';
import { AlertModel } from '../models/AlertModel';
import { AuthModel } from '../models/AuthModel';

import { NavbarView } from '../views/NavbarView';
import { AlertsBannerView } from '../views/AlertsBannerView';
import { TelemetryGaugesView } from '../views/TelemetryGaugesView';
import { StatisticsView } from '../views/StatisticsView';
import { ChartsView } from '../views/ChartsView';
import { SimulatorControlView } from '../views/SimulatorControlView';

import { AlertItem, RoomId, RoomStats, SensorReading } from '../types';
import { calculateMetricStats } from '../utils/statistics';

/**
 * Controller Central do Painel Hospitalar (MVC).
 * Coordena todos os modelos (Telemetria, Configurações, Histórico, Alertas, Autenticação)
 * com as respectivas visualizações e cálculos estatísticos.
 *
 * Implementa a Simulação de Alarme em memória (atendendo ao documento AJUSTES-SIMU-ALARME.md):
 * - Dispara pico de temperatura acima do limite e queda de umidade abaixo do limite;
 * - Exibe alertas visuais explícitos de simulação;
 * - Destaca visualmente os pontos anômalos nos gráficos;
 * - REGRA CRÍTICA: Nenhum dado é gravado no Firebase durante a simulação (estado puramente local);
 * - Ao parar, descarta todos os dados simulados e restaura o estado normal.
 */
export class DashboardController {
  private telemetryModel: TelemetryModel;
  private roomConfigModel: RoomConfigModel;
  private historyModel: HistoryModel;
  private alertModel: AlertModel;
  private authModel: AuthModel;

  private navbarView: NavbarView | null = null;
  private alertsBannerView: AlertsBannerView | null = null;
  private gaugesView: TelemetryGaugesView | null = null;
  private statisticsView: StatisticsView | null = null;
  private chartsView: ChartsView | null = null;
  private simulatorControlView: SimulatorControlView | null = null;

  private sampleSize = 30;

  // Estado da Simulação de Alarme (estritamente em memória local)
  private isAlarmSimulationActive = false;
  private simReadings: Record<RoomId, SensorReading> | null = null;
  private simHistoryS1: SensorReading[] = [];
  private simHistoryS2: SensorReading[] = [];

  constructor(
    telemetryModel: TelemetryModel,
    roomConfigModel: RoomConfigModel,
    historyModel: HistoryModel,
    alertModel: AlertModel,
    authModel: AuthModel
  ) {
    this.telemetryModel = telemetryModel;
    this.roomConfigModel = roomConfigModel;
    this.historyModel = historyModel;
    this.alertModel = alertModel;
    this.authModel = authModel;

    this.bindModelSubscriptions();
  }

  public setViews(
    navbarView: NavbarView,
    alertsBannerView: AlertsBannerView,
    gaugesView: TelemetryGaugesView,
    statisticsView: StatisticsView,
    chartsView: ChartsView
  ): void {
    this.navbarView = navbarView;
    this.alertsBannerView = alertsBannerView;
    this.gaugesView = gaugesView;
    this.statisticsView = statisticsView;
    this.chartsView = chartsView;

    // Renderização inicial
    this.updateAllViews();
  }

  public setSimulatorView(view: SimulatorControlView): void {
    this.simulatorControlView = view;
  }

  private bindModelSubscriptions(): void {
    // 1. Atualizações de telemetria em tempo real
    this.telemetryModel.subscribe((readings) => {
      if (this.isAlarmSimulationActive) {
        // Durante a simulação de alarme, mantemos o estado visual da simulação
        return;
      }
      const configs = this.roomConfigModel.getConfigs();
      this.alertModel.evaluateReadings(readings, configs);
      this.updateGauges();
    });

    // 2. Atualizações de faixas operacionais (Firestore)
    this.roomConfigModel.subscribe((configs) => {
      if (this.isAlarmSimulationActive) {
        return;
      }
      const readings = this.telemetryModel.getCurrentReadings();
      this.alertModel.evaluateReadings(readings, configs);
      this.updateGauges();
      this.updateStatistics();
      this.updateCharts();
    });

    // 3. Atualizações de histórico estruturado (Firestore)
    this.historyModel.subscribe(() => {
      if (this.isAlarmSimulationActive) {
        return;
      }
      this.updateStatistics();
      this.updateCharts();
    });

    // 4. Atualizações de alertas
    this.alertModel.subscribe((alerts) => {
      this.alertsBannerView?.render(alerts);
    });

    // 5. Atualizações de usuário/autenticação (RBAC)
    this.authModel.subscribe((profile) => {
      this.navbarView?.render(profile);
      this.updateGauges();
      this.simulatorControlView?.render(
        undefined,
        undefined,
        this.isAlarmSimulationActive,
        this.authModel.isAdmin()
      );
    });
  }

  /**
   * Alterna o estado da Simulação de Alarme das Salas
   */
  public toggleAlarmSimulation(): void {
    if (this.isAlarmSimulationActive) {
      this.stopAlarmSimulation();
    } else {
      this.startAlarmSimulation();
    }
  }

  /**
   * Inicia a Simulação de Alarme.
   * Gera picos anômalos em memória local sem gravar nenhum dado no Firebase.
   */
  public startAlarmSimulation(): void {
    this.isAlarmSimulationActive = true;
    const configs = this.roomConfigModel.getConfigs();
    const now = Date.now();

    // 1. Identifica os limites configurados das salas (ou padrão)
    const maxTemp1 = configs.sala_1.thresholds.maxTemp;
    const minHum2 = configs.sala_2.thresholds.minHum;

    // Gera:
    // - Pico de temperatura ACIMA do limite máximo configurado da Sala 1
    // - Queda de umidade ABAIXO do limite mínimo configurado da Sala 2
    const peakTempS1 = Number((maxTemp1 + 3.8).toFixed(1)); // ex: 26.8 °C (> 23.0 °C)
    const dropHumS2 = Number((minHum2 - 11.5).toFixed(1));  // ex: 23.5 % (< 35.0 %)

    // 2. Leituras simuladas apenas para a interface (em memória)
    this.simReadings = {
      sala_1: {
        roomId: 'sala_1',
        temperature: peakTempS1, // Pico que ultrapassa limite
        humidity: 48.0,
        timestamp: now,
        sensorStatus: 'online',
        isAnomaly: true
      },
      sala_2: {
        roomId: 'sala_2',
        temperature: 21.6,
        humidity: dropHumS2, // Queda abaixo do limite
        timestamp: now,
        sensorStatus: 'online',
        isAnomaly: true
      }
    };

    // 3. Monta histórico local com os picos fictícios para exibição nos gráficos
    const realHistS1 = this.historyModel.getHistory('sala_1', 25);
    const realHistS2 = this.historyModel.getHistory('sala_2', 25);

    this.simHistoryS1 = realHistS1.map(r => ({ ...r }));
    this.simHistoryS2 = realHistS2.map(r => ({ ...r }));

    // Adiciona pontos intermediários que culminam nos picos anômalos
    this.simHistoryS1.push({
      roomId: 'sala_1',
      temperature: peakTempS1,
      humidity: 48.0,
      timestamp: now,
      sensorStatus: 'online',
      isAnomaly: true
    });

    this.simHistoryS2.push({
      roomId: 'sala_2',
      temperature: 21.6,
      humidity: dropHumS2,
      timestamp: now,
      sensorStatus: 'online',
      isAnomaly: true
    });

    // 4. Cria os dois alertas de simulação visíveis e explícitos
    const simulatedAlerts: AlertItem[] = [
      {
        id: 'sim-alert-temp-s1',
        roomId: 'sala_1',
        roomName: configs.sala_1.roomName,
        metric: 'temperature',
        metricLabel: 'Temperatura (Simulação)',
        value: `${peakTempS1.toFixed(1)} °C`,
        thresholdLimit: `Faixa permitida: ${configs.sala_1.thresholds.minTemp.toFixed(1)}°C a ${maxTemp1.toFixed(1)}°C`,
        message: `[SIMULAÇÃO] Temperatura de ${peakTempS1.toFixed(1)} °C ultrapassou o limite máximo de ${maxTemp1.toFixed(1)} °C na ${configs.sala_1.roomName}. (Dado em memória, zero gravação no Firebase).`,
        severity: 'critical',
        timestamp: now,
        isSimulation: true
      },
      {
        id: 'sim-alert-hum-s2',
        roomId: 'sala_2',
        roomName: configs.sala_2.roomName,
        metric: 'humidity',
        metricLabel: 'Umidade Relativa (Simulação)',
        value: `${dropHumS2.toFixed(1)} %`,
        thresholdLimit: `Faixa permitida: ${minHum2.toFixed(1)}% a ${configs.sala_2.thresholds.maxHum.toFixed(1)}%`,
        message: `[SIMULAÇÃO] Umidade de ${dropHumS2.toFixed(1)} % caiu abaixo do limite mínimo de ${minHum2.toFixed(1)} % na ${configs.sala_2.roomName}. (Dado em memória, zero gravação no Firebase).`,
        severity: 'critical',
        timestamp: now,
        isSimulation: true
      }
    ];

    // Registra alertas no AlertModel em modo estritamente local (SEM gravação no Firestore)
    this.alertModel.setSimulatedAlerts(simulatedAlerts);

    // Atualiza os componentes visuais
    this.updateAllViews();

    // Atualiza estado do botão no painel
    this.simulatorControlView?.render(
      undefined,
      undefined,
      true,
      this.authModel.isAdmin()
    );
  }

  /**
   * Para a Simulação de Alarme.
   * Remove todos os dados fictícios da memória, limpa os alertas e restaura o estado normal.
   */
  public stopAlarmSimulation(): void {
    this.isAlarmSimulationActive = false;
    this.simReadings = null;
    this.simHistoryS1 = [];
    this.simHistoryS2 = [];

    // Remove os alertas simulados da memória
    this.alertModel.clearSimulatedAlerts();

    // Restaura as visualizações para os dados reais
    this.updateAllViews();

    // Restaura o botão para o estado inicial
    this.simulatorControlView?.render(
      undefined,
      undefined,
      false,
      this.authModel.isAdmin()
    );
  }

  public isAlarmSimulationRunning(): boolean {
    return this.isAlarmSimulationActive;
  }

  public handleSampleSizeChange(newSize: number): void {
    this.sampleSize = newSize;
    this.updateStatistics();
  }

  public handleDismissAlert(alertId: string): void {
    this.alertModel.dismissAlert(alertId);
  }

  public updateAllViews(): void {
    const user = this.authModel.getCurrentUser();
    this.navbarView?.render(user);
    this.updateGauges();
    this.updateStatistics();
    this.updateCharts();
    this.alertsBannerView?.render(this.alertModel.getActiveAlerts());
  }

  private updateGauges(): void {
    const configs = this.roomConfigModel.getConfigs();
    const user = this.authModel.getCurrentUser();
    const readings = (this.isAlarmSimulationActive && this.simReadings)
      ? this.simReadings
      : this.telemetryModel.getCurrentReadings();
    this.gaugesView?.render(readings, configs, user);
  }

  private updateStatistics(): void {
    const configs = this.roomConfigModel.getConfigs();
    const histS1 = (this.isAlarmSimulationActive && this.simHistoryS1.length > 0)
      ? this.simHistoryS1.slice(-this.sampleSize)
      : this.historyModel.getHistory('sala_1', this.sampleSize);

    const histS2 = (this.isAlarmSimulationActive && this.simHistoryS2.length > 0)
      ? this.simHistoryS2.slice(-this.sampleSize)
      : this.historyModel.getHistory('sala_2', this.sampleSize);

    const stats: Record<RoomId, RoomStats> = {
      sala_1: {
        roomId: 'sala_1',
        sampleCount: histS1.length,
        temperature: calculateMetricStats(histS1.map(r => r.temperature)),
        humidity: calculateMetricStats(histS1.map(r => r.humidity))
      },
      sala_2: {
        roomId: 'sala_2',
        sampleCount: histS2.length,
        temperature: calculateMetricStats(histS2.map(r => r.temperature)),
        humidity: calculateMetricStats(histS2.map(r => r.humidity))
      }
    };

    this.statisticsView?.render(stats, configs);
  }

  private updateCharts(): void {
    const configs = this.roomConfigModel.getConfigs();
    const histS1 = (this.isAlarmSimulationActive && this.simHistoryS1.length > 0)
      ? this.simHistoryS1
      : this.historyModel.getHistory('sala_1', 50);
    const histS2 = (this.isAlarmSimulationActive && this.simHistoryS2.length > 0)
      ? this.simHistoryS2
      : this.historyModel.getHistory('sala_2', 50);
    this.chartsView?.updateChartData(histS1, histS2, configs);
  }
}
