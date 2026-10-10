export interface SimulatorCallbacks {
  onToggleActive: () => void;
  onInjectAnomaly: (type: 'high_temp_s1' | 'low_temp_s1' | 'high_hum_s2' | 'offline_s1' | 'reset') => void;
  onToggleAlarmSimulation: () => void;
}

/**
 * View: Painel de Administração e Simulação de Alarme das Salas.
 * Contém o botão de Simulação de Alarme em memória (atendendo ao documento AJUSTES-SIMU-ALARME.md),
 * garantindo zero persistência no Firebase durante a simulação de anomalias.
 */
export class SimulatorControlView {
  private container: HTMLElement;
  private callbacks: SimulatorCallbacks;
  private isRunning = true;
  private packetCount = 0;
  private isAlarmSimulationActive = false;
  private isAdmin = true;

  constructor(container: HTMLElement, callbacks: SimulatorCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(
    isRunning?: boolean,
    packetCount?: number,
    isAlarmSimulationActive?: boolean,
    isAdmin?: boolean
  ): void {
    if (isRunning !== undefined) this.isRunning = isRunning;
    if (packetCount !== undefined) this.packetCount = packetCount;
    if (isAlarmSimulationActive !== undefined) this.isAlarmSimulationActive = isAlarmSimulationActive;
    if (isAdmin !== undefined) this.isAdmin = isAdmin;

    this.container.innerHTML = `
      <section class="glass-panel rounded-2xl p-4 sm:p-5 mb-8 border border-slate-800" aria-label="Painel de Administração e Simulação">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <!-- Informações do Painel Administrativo -->
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="p-1 rounded-md bg-hospital-500/20 text-hospital-300">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <h3 class="font-bold text-sm text-slate-100">Painel de Administração • Controle e Simulação de Alarmes</h3>
              <span class="text-xs px-2 py-0.5 rounded-full font-mono ${
                this.isAlarmSimulationActive
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse font-bold'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }">
                ${this.isAlarmSimulationActive ? '● SIMULAÇÃO DE ALARME ATIVA' : 'Status: Normal'}
              </span>
            </div>
            <p class="text-xs text-slate-400">
              Gere picos simulados de temperatura e umidade em memória local para testar acionamento de alertas sem persistir dados no Firebase.
            </p>
          </div>

          <!-- BOTÃO PRINCIPAL DE SIMULAÇÃO DE ALARME -->
          <div class="flex flex-wrap items-center gap-3">
            <button id="btn-toggle-alarm-sim"
              title="${this.isAlarmSimulationActive ? 'Parar simulação e restaurar dados normais' : 'Iniciar simulação com picos acima e abaixo dos limites'}"
              class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                this.isAlarmSimulationActive
                  ? 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-2 border-rose-500 shadow-rose-900/60 animate-pulse'
                  : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/30'
              }">
              ${this.isAlarmSimulationActive ? `
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span>⏹ Parar Simulação de Alarme</span>
              ` : `
                <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>🚨 Iniciar Simulação de Alarme</span>
              `}
            </button>

            <!-- Status de proteção Firebase -->
            ${this.isAlarmSimulationActive ? `
              <div class="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-800/80 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Zero Escrita no Firebase (Estado em Memória)</span>
              </div>
            ` : ''}

            <!-- Botão de Pausar/Iniciar Sensores de Fundo -->
            <button id="btn-toggle-sim" class="px-3 py-2 rounded-lg text-xs font-semibold ${
              this.isRunning ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
            } transition-all shadow-sm flex items-center gap-1.5">
              <span>${this.isRunning ? 'Pausar Telemetria' : 'Retomar Telemetria'}</span>
            </button>

            <!-- Contador de Pacotes e Nível de Acesso -->
            <div class="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 hidden sm:flex items-center gap-2">
              <span>Pacotes: <strong class="text-hospital-400">${this.packetCount}</strong></span>
              ${this.isAdmin ? `<span class="text-[10px] text-indigo-400 font-bold">• Painel Admin</span>` : ''}
            </div>
          </div>

        </div>
      </section>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const btnAlarmSim = this.container.querySelector('#btn-toggle-alarm-sim');
    const btnToggle = this.container.querySelector('#btn-toggle-sim');

    if (btnAlarmSim) {
      btnAlarmSim.addEventListener('click', () => {
        this.callbacks.onToggleAlarmSimulation();
      });
    }

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        this.callbacks.onToggleActive();
      });
    }
  }

  public setAlarmSimulationState(isActive: boolean): void {
    this.isAlarmSimulationActive = isActive;
    this.render();
  }
}
