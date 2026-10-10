import { RoomStats, RoomConfig, RoomId } from '../types';

export interface StatisticsCallbacks {
  onChangeSampleSize: (size: number) => void;
}

/**
 * View: Indicadores Estatísticos das Salas Hospitalares.
 * Atende ao Requisito 4: Apresenta média aritmética, mediana e desvio padrão
 * para temperatura e umidade, calculados por sala sobre o conjunto selecionado.
 */
export class StatisticsView {
  private container: HTMLElement;
  private callbacks: StatisticsCallbacks;
  private currentSampleSize = 30;

  constructor(container: HTMLElement, callbacks: StatisticsCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(
    stats: Record<RoomId, RoomStats>,
    configs: Record<RoomId, RoomConfig>
  ): void {
    const roomIds: RoomId[] = ['sala_1', 'sala_2'];

    this.container.innerHTML = `
      <section class="glass-panel rounded-2xl p-5 sm:p-6 mb-8" aria-label="Indicadores Estatísticos">
        
        <!-- Cabeçalho do Painel Estatístico -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-hospital-500/10 text-hospital-400 border border-hospital-500/20">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 20V10"/>
                  <path d="M12 20V4"/>
                  <path d="M6 20v-6"/>
                </svg>
              </span>
              <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Indicadores Estatísticos de Estabilidade</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Média aritmética (x̄), mediana (Md) e desvio padrão amostral (s) conforme Requisito 4.
            </p>
          </div>

          <!-- Seletor do tamanho da amostra para o cálculo estatístico -->
          <div class="flex items-center gap-2">
            <label for="sample-select" class="text-xs text-slate-400 font-medium">Amostras:</label>
            <select id="sample-select" class="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-hospital-500 font-mono">
              <option value="15" ${this.currentSampleSize === 15 ? 'selected' : ''}>Últimas 15 leituras</option>
              <option value="30" ${this.currentSampleSize === 30 ? 'selected' : ''}>Últimas 30 leituras</option>
              <option value="50" ${this.currentSampleSize === 50 ? 'selected' : ''}>Últimas 50 leituras</option>
              <option value="100" ${this.currentSampleSize === 100 ? 'selected' : ''}>Últimas 100 leituras</option>
            </select>
          </div>
        </div>

        <!-- Grade com os Indicadores de Cada Sala -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${roomIds.map(roomId => {
            const roomStat = stats[roomId];
            const config = configs[roomId];
            const temp = roomStat ? roomStat.temperature : { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
            const hum = roomStat ? roomStat.humidity : { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
            const count = roomStat ? roomStat.sampleCount : 0;

            return `
              <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${roomId === 'sala_1' ? 'bg-hospital-400' : 'bg-cyan-400'}"></span>
                    <h3 class="font-bold text-sm text-slate-100">${config.roomName}</h3>
                  </div>
                  <span class="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    n = ${count} amostras
                  </span>
                </div>

                <!-- Tabela de Comparação Estatística -->
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="text-[10px] font-mono text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                      <tr>
                        <th class="py-2 px-2.5">Grandeza</th>
                        <th class="py-2 px-2 text-right">Média (x̄)</th>
                        <th class="py-2 px-2 text-right">Mediana (Md)</th>
                        <th class="py-2 px-2 text-right">Desvio Padrão (s)</th>
                        <th class="py-2 px-2 text-right">Min / Max</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono">
                      
                      <!-- Linha Temperatura -->
                      <tr class="hover:bg-slate-800/20">
                        <td class="py-2.5 px-2.5 font-sans font-medium text-slate-300 flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Temperatura
                        </td>
                        <td class="py-2.5 px-2 text-right font-bold text-amber-300">${temp.mean.toFixed(2)} °C</td>
                        <td class="py-2.5 px-2 text-right text-slate-200">${temp.median.toFixed(2)} °C</td>
                        <td class="py-2.5 px-2 text-right ${temp.stdDev > 1.0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}">
                          ±${temp.stdDev.toFixed(2)} °C
                        </td>
                        <td class="py-2.5 px-2 text-right text-slate-400 text-[11px]">
                          ${temp.min.toFixed(1)} / ${temp.max.toFixed(1)} °C
                        </td>
                      </tr>

                      <!-- Linha Umidade -->
                      <tr class="hover:bg-slate-800/20">
                        <td class="py-2.5 px-2.5 font-sans font-medium text-slate-300 flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          Umidade Rel.
                        </td>
                        <td class="py-2.5 px-2 text-right font-bold text-cyan-300">${hum.mean.toFixed(2)} %</td>
                        <td class="py-2.5 px-2 text-right text-slate-200">${hum.median.toFixed(2)} %</td>
                        <td class="py-2.5 px-2 text-right ${hum.stdDev > 4.0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}">
                          ±${hum.stdDev.toFixed(2)} %
                        </td>
                        <td class="py-2.5 px-2 text-right text-slate-400 text-[11px]">
                          ${hum.min.toFixed(1)} / ${hum.max.toFixed(1)} %
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                <div class="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Estabilidade Térmica: <strong class="${temp.stdDev < 0.8 ? 'text-emerald-400' : 'text-amber-400'}">${temp.stdDev < 0.8 ? 'Excelente (Baixa Dispersão)' : 'Atenção (Oscilação)'}</strong></span>
                  <span>Dispersão de Umidade: <strong class="${hum.stdDev < 3.0 ? 'text-emerald-400' : 'text-amber-400'}">${hum.stdDev < 3.0 ? 'Estável' : 'Flutuante'}</strong></span>
                </div>

              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 flex items-start gap-2">
          <svg class="w-4 h-4 text-hospital-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>
            <strong>Interpretação Clínica:</strong> O desvio padrão (s) quantifica a estabilidade ambiental. Em salas de equipamentos médicos de alta precisão (ex: tomógrafos), valores baixos de desvio padrão indicam ambiente controlado sem choques térmicos, prevenindo falhas precoces em detectores e computadores.
          </span>
        </div>

      </section>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const select = this.container.querySelector<HTMLSelectElement>('#sample-select');
    if (select) {
      select.addEventListener('change', () => {
        const size = parseInt(select.value, 10);
        this.currentSampleSize = size;
        this.callbacks.onChangeSampleSize(size);
      });
    }
  }
}
