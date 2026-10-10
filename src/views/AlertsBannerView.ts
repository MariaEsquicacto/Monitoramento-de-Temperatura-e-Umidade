import { AlertItem } from '../types';
import { formatTimeOnly } from '../utils/formatters';

export interface AlertsBannerCallbacks {
  onDismissAlert: (alertId: string) => void;
}

/**
 * View: Banner e Painel de Alertas Visuais Destacados.
 * Atende ao Requisito 3: exibe alerta visual destacado com a sala,
 * a grandeza e o valor afetado quando qualquer limite é ultrapassado.
 */
export class AlertsBannerView {
  private container: HTMLElement;
  private callbacks: AlertsBannerCallbacks;

  constructor(container: HTMLElement, callbacks: AlertsBannerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(alerts: AlertItem[]): void {
    if (alerts.length === 0) {
      this.container.innerHTML = `
        <div class="mb-6 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between transition-all">
          <div class="flex items-center gap-3">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p class="text-xs font-semibold text-emerald-300">Todas as salas operando dentro dos parâmetros de segurança médica</p>
              <p class="text-[11px] text-slate-400">Sensores ativos e limites de temperatura e umidade em conformidade com ABNT NBR 7256.</p>
            </div>
          </div>
          <span class="hidden sm:inline-block text-[11px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">Status Nominal</span>
        </div>
      `;
      return;
    }

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;

    this.container.innerHTML = `
      <section class="mb-6 space-y-3" aria-label="Alertas Médicos Críticos">
        <!-- Alerta de Topo com Efeito Pulsante -->
        <div class="p-4 rounded-xl border ${
          criticalCount > 0 ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-900/20' : 'bg-amber-950/40 border-amber-600/60'
        } backdrop-blur-md animate-pulse-fast">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg ${criticalCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-900'} mt-0.5 shadow-md">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-sm text-white tracking-wide uppercase">
                    ${criticalCount > 0 ? 'ANOMALIA HOSPITALAR DETECTADA' : 'AVISO DE VARIAÇÃO AMBIENTAL'}
                  </h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 border border-rose-500/40">
                    ${alerts.length} ${alerts.length === 1 ? 'ALERTA ATIVO' : 'ALERTAS ATIVOS'}
                  </span>
                </div>
                <p class="text-xs text-rose-200/90 mt-0.5">
                  Identificação imediata de condição anormal nos equipamentos médicos. Intervenção preventiva recomendada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista detalhada dos alertas individuais -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${alerts.map(alert => `
            <div class="p-3.5 rounded-xl border ${
              alert.severity === 'critical' ? 'bg-[#1C1217] border-rose-500/50' : 'bg-[#1A1612] border-amber-500/50'
            } flex items-start justify-between gap-3 shadow-md">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-xs text-white">${alert.roomName}</span>
                  ${alert.isSimulation ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-purple-500/30 text-purple-200 border border-purple-500/50 uppercase tracking-wide animate-pulse">
                      ⚡ SIMULAÇÃO (EM MEMÓRIA)
                    </span>
                  ` : ''}
                  <span class="text-[10px] font-mono text-slate-400">• ${formatTimeOnly(alert.timestamp)}</span>
                </div>
                
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-slate-300">Grandeza: <strong class="text-white">${alert.metricLabel}</strong></span>
                  <span class="text-slate-400">|</span>
                  <span class="font-mono font-extrabold ${alert.severity === 'critical' ? 'text-rose-400 text-sm' : 'text-amber-400 text-sm'}">
                    ${alert.value}
                  </span>
                </div>

                <div class="text-[11px] text-slate-300">
                  <span class="text-slate-400">${alert.thresholdLimit}</span>
                </div>

                <p class="text-xs ${alert.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'} font-medium">
                  ${alert.message}
                </p>
              </div>

              <button data-dismiss-id="${alert.id}" title="Reconhecer e dispensar alerta" class="btn-dismiss-alert text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const dismissButtons = this.container.querySelectorAll<HTMLButtonElement>('.btn-dismiss-alert');
    dismissButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-dismiss-id');
        if (id) {
          this.callbacks.onDismissAlert(id);
        }
      });
    });
  }
}
