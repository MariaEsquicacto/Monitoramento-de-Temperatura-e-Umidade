import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { RoomConfig, RoomId, SensorReading } from '../types';
import { formatTimeOnly } from '../utils/formatters';

// Registra módulos do Chart.js necessários
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type MetricType = 'temperature' | 'humidity';

export interface ChartsCallbacks {
  onToggleMetric: (metric: MetricType) => void;
}

/**
 * View: Gráficos em Tempo Real e Séries Históricas com Chart.js.
 * Atende ao Requisito 5: gráficos de fluxo ao vivo e histórico comparativo
 * entre as duas salas, com limites operacionais visíveis.
 */
export class ChartsView {
  private container: HTMLElement;
  private callbacks: ChartsCallbacks;
  private activeMetric: MetricType = 'temperature';

  private liveChart: Chart | null = null;
  private historyChart: Chart | null = null;

  constructor(container: HTMLElement, callbacks: ChartsCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    this.container.innerHTML = `
      <section class="mb-8 space-y-6" aria-label="Visualização Gráfica de Telemetria">
        
        <!-- Barra de Controle de Métricas (Temperatura vs Umidade) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <svg class="w-5 h-5 text-hospital-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Evolução Temporal e Análise Comparativa
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Acompanhamento contínuo e identificação de ocorrências fora das faixas limites.</p>
          </div>

          <!-- Botões de Alternância de Métrica -->
          <div class="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
            <button id="btn-metric-temp" class="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              this.activeMetric === 'temperature'
                ? 'bg-hospital-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }">
              <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
              </svg>
              Temperatura (°C)
            </button>

            <button id="btn-metric-hum" class="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              this.activeMetric === 'humidity'
                ? 'bg-hospital-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }">
              <svg class="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
              Umidade Relativa (%)
            </button>
          </div>
        </div>

        <!-- Grade com 2 Gráficos: Tempo Real à Esquerda, Histórico Comparativo à Direita -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          <!-- Gráfico 1: Fluxo em Tempo Real -->
          <div class="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 class="font-bold text-sm text-slate-100">Fluxo em Tempo Real (Live Stream)</h3>
              </div>
              <span class="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                Firebase Realtime DB
              </span>
            </div>
            
            <div class="relative w-full h-64 sm:h-72">
              <canvas id="chart-live"></canvas>
            </div>
          </div>

          <!-- Gráfico 2: Histórico e Limites Operacionais -->
          <div class="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-hospital-400"></span>
                <h3 class="font-bold text-sm text-slate-100">Histórico & Limites Operacionais</h3>
              </div>
              <span class="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                Cloud Firestore
              </span>
            </div>

            <div class="relative w-full h-64 sm:h-72">
              <canvas id="chart-history"></canvas>
            </div>
          </div>

        </div>

      </section>
    `;

    this.attachEvents();
    this.initCharts();
  }

  private attachEvents(): void {
    const btnTemp = this.container.querySelector('#btn-metric-temp');
    const btnHum = this.container.querySelector('#btn-metric-hum');

    if (btnTemp) {
      btnTemp.addEventListener('click', () => {
        if (this.activeMetric !== 'temperature') {
          this.activeMetric = 'temperature';
          this.callbacks.onToggleMetric('temperature');
          this.render();
        }
      });
    }

    if (btnHum) {
      btnHum.addEventListener('click', () => {
        if (this.activeMetric !== 'humidity') {
          this.activeMetric = 'humidity';
          this.callbacks.onToggleMetric('humidity');
          this.render();
        }
      });
    }
  }

  private initCharts(): void {
    const liveCanvas = this.container.querySelector<HTMLCanvasElement>('#chart-live');
    const historyCanvas = this.container.querySelector<HTMLCanvasElement>('#chart-history');

    if (liveCanvas) {
      if (this.liveChart) this.liveChart.destroy();
      this.liveChart = new Chart(liveCanvas, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Sala 1 (Tomografia)',
              borderColor: '#14B8A6',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderWidth: 2.5,
              tension: 0.3,
              pointRadius: 3,
              pointHoverRadius: 6,
              data: []
            },
            {
              label: 'Sala 2 (Suporte à Vida)',
              borderColor: '#06B6D4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              borderWidth: 2.5,
              tension: 0.3,
              pointRadius: 3,
              pointHoverRadius: 6,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              ticks: { color: '#64748B', font: { size: 10 } },
              grid: { color: '#1E293B' }
            },
            y: {
              ticks: { color: '#64748B', font: { size: 10 } },
              grid: { color: '#1E293B' }
            }
          }
        }
      });
    }

    if (historyCanvas) {
      if (this.historyChart) this.historyChart.destroy();
      this.historyChart = new Chart(historyCanvas, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Sala 1 (Tomografia)',
              borderColor: '#14B8A6',
              backgroundColor: 'rgba(20, 184, 166, 0.08)',
              borderWidth: 2,
              tension: 0.25,
              fill: false,
              pointRadius: 2,
              data: []
            },
            {
              label: 'Sala 2 (Suporte à Vida)',
              borderColor: '#06B6D4',
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              borderWidth: 2,
              tension: 0.25,
              fill: false,
              pointRadius: 2,
              data: []
            },
            {
              label: 'Limite Superior Seguro',
              borderColor: 'rgba(244, 63, 94, 0.7)',
              borderDash: [6, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              data: []
            },
            {
              label: 'Limite Inferior Seguro',
              borderColor: 'rgba(56, 189, 248, 0.7)',
              borderDash: [6, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              ticks: { color: '#64748B', font: { size: 10 } },
              grid: { color: '#1E293B' }
            },
            y: {
              ticks: { color: '#64748B', font: { size: 10 } },
              grid: { color: '#1E293B' }
            }
          }
        }
      });
    }
  }

  /**
   * Atualiza os dados do gráfico com o histórico mais recente
   */
  public updateChartData(
    historyS1: SensorReading[],
    historyS2: SensorReading[],
    configs: Record<RoomId, RoomConfig>
  ): void {
    if (!this.liveChart || !this.historyChart) return;

    const isTemp = this.activeMetric === 'temperature';

    // Gráfico em Tempo Real: últimas 15 amostras
    const liveS1 = historyS1.slice(-15);
    const liveS2 = historyS2.slice(-15);

    const liveLabels = liveS1.map(r => formatTimeOnly(r.timestamp));
    const liveData1 = liveS1.map(r => isTemp ? r.temperature : r.humidity);
    const liveData2 = liveS2.map(r => isTemp ? r.temperature : r.humidity);

    // Limites da Sala 1 e Sala 2
    const upperLimitS1 = isTemp ? configs.sala_1.thresholds.maxTemp : configs.sala_1.thresholds.maxHum;
    const lowerLimitS1 = isTemp ? configs.sala_1.thresholds.minTemp : configs.sala_1.thresholds.minHum;
    const upperLimitS2 = isTemp ? configs.sala_2.thresholds.maxTemp : configs.sala_2.thresholds.maxHum;
    const lowerLimitS2 = isTemp ? configs.sala_2.thresholds.minTemp : configs.sala_2.thresholds.minHum;

    // Helper para gerar visualização destacada de picos anômalos
    const getPointVisuals = (values: number[], upper: number, lower: number, defaultColor: string) => {
      const pointRadius = values.map(v => (v > upper || v < lower ? 8 : 3));
      const pointHoverRadius = values.map(v => (v > upper || v < lower ? 11 : 6));
      const pointBackgroundColor = values.map(v => (v > upper ? '#EF4444' : v < lower ? '#F59E0B' : defaultColor));
      const pointBorderColor = values.map(v => (v > upper || v < lower ? '#FFFFFF' : defaultColor));
      const pointBorderWidth = values.map(v => (v > upper || v < lower ? 2.5 : 1));
      const pointStyle = values.map(v => (v > upper ? 'triangle' as const : v < lower ? 'rectRot' as const : 'circle' as const));

      return {
        pointRadius,
        pointHoverRadius,
        pointBackgroundColor,
        pointBorderColor,
        pointBorderWidth,
        pointStyle
      };
    };

    // Aplica nos datasets do gráfico em tempo real
    const liveVis1 = getPointVisuals(liveData1, upperLimitS1, lowerLimitS1, '#14B8A6');
    const liveVis2 = getPointVisuals(liveData2, upperLimitS2, lowerLimitS2, '#06B6D4');

    this.liveChart.data.labels = liveLabels;
    this.liveChart.data.datasets[0].data = liveData1;
    Object.assign(this.liveChart.data.datasets[0], liveVis1);

    this.liveChart.data.datasets[1].data = liveData2;
    Object.assign(this.liveChart.data.datasets[1], liveVis2);

    this.liveChart.update('none');

    // Gráfico Histórico: até 40 amostras com linhas de limites das faixas
    const histS1 = historyS1.slice(-40);
    const histS2 = historyS2.slice(-40);

    const histLabels = histS1.map(r => formatTimeOnly(r.timestamp));
    const histData1 = histS1.map(r => isTemp ? r.temperature : r.humidity);
    const histData2 = histS2.map(r => isTemp ? r.temperature : r.humidity);

    const histVis1 = getPointVisuals(histData1, upperLimitS1, lowerLimitS1, '#14B8A6');
    const histVis2 = getPointVisuals(histData2, upperLimitS2, lowerLimitS2, '#06B6D4');

    // Linhas de referência de limites (usando Sala 1 como padrão comparativo)
    const upperLimit = upperLimitS1;
    const lowerLimit = lowerLimitS1;

    const upperLine = histLabels.map(() => upperLimit);
    const lowerLine = histLabels.map(() => lowerLimit);

    this.historyChart.data.labels = histLabels;
    this.historyChart.data.datasets[0].data = histData1;
    Object.assign(this.historyChart.data.datasets[0], histVis1);

    this.historyChart.data.datasets[1].data = histData2;
    Object.assign(this.historyChart.data.datasets[1], histVis2);

    this.historyChart.data.datasets[2].data = upperLine;
    this.historyChart.data.datasets[3].data = lowerLine;
    this.historyChart.update('none');
  }

  public getActiveMetric(): MetricType {
    return this.activeMetric;
  }
}
