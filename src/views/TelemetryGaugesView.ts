import { RoomConfig, RoomId, SensorReading, UserProfile } from '../types';
import { formatTemperature, formatHumidity, formatTimeOnly } from '../utils/formatters';

export interface TelemetryGaugesCallbacks {
  onOpenConfigModal: (roomId: RoomId) => void;
}

/**
 * View: Cartões e Medidores de Telemetria das Salas Hospitalares.
 * Apresenta leituras de temperatura e umidade em tempo real para Sala 1 e Sala 2,
 * estado de conectividade do sensor e faixas operacionais configuradas.
 */
export class TelemetryGaugesView {
  private container: HTMLElement;
  private callbacks: TelemetryGaugesCallbacks;

  constructor(container: HTMLElement, callbacks: TelemetryGaugesCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(
    readings: Record<RoomId, SensorReading | null>,
    configs: Record<RoomId, RoomConfig>,
    currentUser: UserProfile | null
  ): void {
    const roomIds: RoomId[] = ['sala_1', 'sala_2'];
    const isAdmin = currentUser?.role === 'admin';

    this.container.innerHTML = `
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" aria-label="Telemetria das Salas Hospitalares">
        ${roomIds.map(roomId => {
          const config = configs[roomId];
          const reading = readings[roomId];
          const isOffline = !reading || reading.sensorStatus === 'offline';
          const { minTemp, maxTemp, minHum, maxHum } = config.thresholds;

          const temp = reading ? reading.temperature : 0;
          const hum = reading ? reading.humidity : 0;

          const isTempAbnormal = reading && !isOffline && (temp < minTemp || temp > maxTemp);
          const isHumAbnormal = reading && !isOffline && (hum < minHum || hum > maxHum);
          const hasAnomaly = isTempAbnormal || isHumAbnormal || isOffline;

          // Cálculo da porcentagem visual para barras de progresso
          const tempPercent = Math.min(Math.max(((temp - 10) / (40 - 10)) * 100, 5), 95);
          const humPercent = Math.min(Math.max(hum, 5), 95);

          return `
            <div class="rounded-2xl transition-all duration-300 ${
              hasAnomaly ? 'glass-panel-alert' : 'glass-panel hover:border-hospital-500/40'
            } p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
              
              <!-- Cabeçalho do Cartão da Sala -->
              <div>
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-hospital-950/80 text-hospital-300 border border-hospital-800/60 uppercase">
                        ${roomId === 'sala_1' ? 'SALA 01' : 'SALA 02'}
                      </span>
                      <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">${config.roomName}</h2>
                    </div>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-1">${config.description}</p>
                  </div>

                  <!-- Status do Sensor (Heartbeat) -->
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${
                      isOffline
                        ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    }">
                      <span class="w-2 h-2 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-400 sensor-heartbeat'}"></span>
                      <span class="font-bold">${isOffline ? 'OFFLINE' : 'ONLINE'}</span>
                    </div>

                    <!-- Botão de Configuração de Limites -->
                    <button data-config-room="${roomId}" title="${isAdmin ? 'Alterar faixas operacionais' : 'Acesso somente leitura (Admin necessário)'}"
                      class="btn-open-config p-2 rounded-lg ${
                        isAdmin ? 'bg-slate-800 hover:bg-hospital-600/30 hover:text-hospital-300 text-slate-300 border border-slate-700' : 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed'
                      } transition-colors">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Painel com os dois medidores: Temperatura e Umidade -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  
                  <!-- Medidor de Temperatura -->
                  <div class="p-4 rounded-xl bg-slate-900/60 border ${
                    isTempAbnormal ? 'border-rose-500/80 bg-rose-950/20' : 'border-slate-800'
                  } transition-all">
                    <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span class="flex items-center gap-1.5 font-medium">
                        <svg class="w-4 h-4 ${isTempAbnormal ? 'text-rose-400' : 'text-amber-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                        </svg>
                        Temperatura
                      </span>
                      <span class="font-mono text-[11px] ${
                        isTempAbnormal ? 'text-rose-400 font-bold' : 'text-slate-400'
                      }">
                        ${isTempAbnormal ? (temp > maxTemp ? '▲ ALTA' : '▼ BAIXA') : '✓ Normal'}
                      </span>
                    </div>

                    <div class="flex items-baseline justify-between mb-3">
                      <span class="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                        isOffline ? 'text-slate-500' : isTempAbnormal ? 'text-rose-400' : 'text-slate-100'
                      }">
                        ${isOffline ? '--.-' : formatTemperature(temp)}
                      </span>
                    </div>

                    <!-- Barra de faixa de temperatura -->
                    <div class="space-y-1.5">
                      <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div class="h-full rounded-full transition-all duration-500 ${
                          isTempAbnormal ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                        }" style="width: ${tempPercent}%"></div>
                      </div>
                      <div class="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Min: ${minTemp.toFixed(1)}°C</span>
                        <span class="text-hospital-400">Padrão Seguro</span>
                        <span>Max: ${maxTemp.toFixed(1)}°C</span>
                      </div>
                    </div>
                  </div>

                  <!-- Medidor de Umidade Relativa -->
                  <div class="p-4 rounded-xl bg-slate-900/60 border ${
                    isHumAbnormal ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-800'
                  } transition-all">
                    <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span class="flex items-center gap-1.5 font-medium">
                        <svg class="w-4 h-4 ${isHumAbnormal ? 'text-amber-400' : 'text-cyan-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                        </svg>
                        Umidade Relativa
                      </span>
                      <span class="font-mono text-[11px] ${
                        isHumAbnormal ? 'text-amber-400 font-bold' : 'text-slate-400'
                      }">
                        ${isHumAbnormal ? (hum > maxHum ? '▲ ALTA' : '▼ BAIXA') : '✓ Normal'}
                      </span>
                    </div>

                    <div class="flex items-baseline justify-between mb-3">
                      <span class="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                        isOffline ? 'text-slate-500' : isHumAbnormal ? 'text-amber-400' : 'text-cyan-300'
                      }">
                        ${isOffline ? '--.-' : formatHumidity(hum)}
                      </span>
                    </div>

                    <!-- Barra de faixa de umidade -->
                    <div class="space-y-1.5">
                      <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div class="h-full rounded-full transition-all duration-500 ${
                          isHumAbnormal ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-400'
                        }" style="width: ${humPercent}%"></div>
                      </div>
                      <div class="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Min: ${minHum.toFixed(1)}%</span>
                        <span class="text-cyan-400">Faixa Médica</span>
                        <span>Max: ${maxHum.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Rodapé do Cartão com Timestamp da Leitura -->
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span class="font-mono">
                  ${reading ? `Última sincronização: ${formatTimeOnly(reading.timestamp)}` : 'Aguardando telemetria...'}
                </span>
                <span class="text-slate-400 text-[10px]">
                  ${config.updatedBy}
                </span>
              </div>

            </div>
          `;
        }).join('')}
      </section>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const buttons = this.container.querySelectorAll<HTMLButtonElement>('.btn-open-config');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.getAttribute('data-config-room') as RoomId;
        if (roomId) {
          this.callbacks.onOpenConfigModal(roomId);
        }
      });
    });
  }
}
