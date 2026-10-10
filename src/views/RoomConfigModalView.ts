import { RoomConfig, RoomThresholds, UserProfile } from '../types';
import { DEFAULT_ROOM_CONFIGS } from '../config/constants';

export interface RoomConfigModalCallbacks {
  onSave: (config: RoomConfig, newThresholds: RoomThresholds) => Promise<void>;
  onClose: () => void;
}

/**
 * View: Modal de Configuração das Faixas Operacionais da Sala.
 * Atende aos Requisitos 2 e 6: permite ao Administrador parametrizar os limites
 * e bloqueia a alteração para Usuários Comuns (somente leitura).
 */
export class RoomConfigModalView {
  private modalContainer: HTMLElement;
  private callbacks: RoomConfigModalCallbacks;

  constructor(modalContainer: HTMLElement, callbacks: RoomConfigModalCallbacks) {
    this.modalContainer = modalContainer;
    this.callbacks = callbacks;
  }

  public open(config: RoomConfig, currentUser: UserProfile | null): void {
    const isAdmin = currentUser?.role === 'admin';
    const defaults = DEFAULT_ROOM_CONFIGS[config.roomId].thresholds;

    this.modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div class="glass-panel-glow bg-[#0E1626] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
          
          <!-- Cabeçalho do Modal -->
          <div class="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="p-1.5 rounded-lg bg-hospital-500/10 text-hospital-400 border border-hospital-500/30">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </span>
                <h3 class="font-bold text-base text-white">Faixas Operacionais Médicas</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">${config.roomName}</p>
            </div>

            <button id="btn-modal-close" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Mensagem de Restrição de Permissão (Requisito 6) -->
          ${!isAdmin ? `
            <div class="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-3 text-xs text-amber-200">
              <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <strong class="text-white block font-semibold">Modo Somente Leitura (Usuário Comum)</strong>
                Apenas Administradores possuem permissão para alterar os limites de temperatura e umidade. As regras de segurança do Firestore rejeitam gravações não autorizadas.
              </div>
            </div>
          ` : `
            <div class="mt-4 p-3 rounded-xl bg-hospital-950/30 border border-hospital-800/40 text-xs text-hospital-200 flex items-center justify-between">
              <span>Papel: <strong>Administrador Hospitalar</strong></span>
              <span class="text-[10px] font-mono bg-hospital-900/60 px-2 py-0.5 rounded text-hospital-300">Permissão Total</span>
            </div>
          `}

          <!-- Formulário de Limites de Temperatura e Umidade -->
          <form id="form-room-thresholds" class="mt-4 space-y-4">
            
            <!-- Grupo Temperatura -->
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
                Limites de Temperatura (°C)
              </h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Mínimo (°C)</label>
                  <input type="number" step="0.1" id="input-min-temp" value="${config.thresholds.minTemp}"
                    ${!isAdmin ? 'disabled' : ''}
                    class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-hospital-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Máximo (°C)</label>
                  <input type="number" step="0.1" id="input-max-temp" value="${config.thresholds.maxTemp}"
                    ${!isAdmin ? 'disabled' : ''}
                    class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-hospital-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
              </div>
              <p class="text-[10px] text-slate-500 mt-1 font-mono">Padrão da norma médica: Min ${defaults.minTemp}°C / Max ${defaults.maxTemp}°C</p>
            </div>

            <!-- Grupo Umidade -->
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 class="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                Limites de Umidade Relativa (%)
              </h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Mínimo (%)</label>
                  <input type="number" step="0.5" id="input-min-hum" value="${config.thresholds.minHum}"
                    ${!isAdmin ? 'disabled' : ''}
                    class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-hospital-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Máximo (%)</label>
                  <input type="number" step="0.5" id="input-max-hum" value="${config.thresholds.maxHum}"
                    ${!isAdmin ? 'disabled' : ''}
                    class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-hospital-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
              </div>
              <p class="text-[10px] text-slate-500 mt-1 font-mono">Padrão da norma médica: Min ${defaults.minHum}% / Max ${defaults.maxHum}%</p>
            </div>

            <div id="modal-error-msg" class="hidden text-xs text-rose-400 font-medium"></div>

            <!-- Botões de Ação -->
            <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
              ${isAdmin ? `
                <button type="button" id="btn-restore-defaults" class="text-xs text-hospital-400 hover:text-hospital-300 underline font-mono">
                  Restaurar Padrão NBR 7256
                </button>
              ` : `<span></span>`}

              <div class="flex items-center gap-2">
                <button type="button" id="btn-cancel" class="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                  Fechar
                </button>
                
                ${isAdmin ? `
                  <button type="submit" id="btn-save-thresholds" class="px-4 py-2 rounded-lg text-xs font-semibold bg-hospital-600 hover:bg-hospital-500 text-white transition-all shadow-md shadow-hospital-600/30 flex items-center gap-1.5">
                    <span>Salvar Limites</span>
                  </button>
                ` : ''}
              </div>
            </div>

          </form>

        </div>
      </div>
    `;

    this.attachEvents(config, defaults);
  }

  private attachEvents(config: RoomConfig, defaults: RoomThresholds): void {
    const btnClose = this.modalContainer.querySelector('#btn-modal-close');
    const btnCancel = this.modalContainer.querySelector('#btn-cancel');
    const form = this.modalContainer.querySelector<HTMLFormElement>('#form-room-thresholds');
    const btnRestore = this.modalContainer.querySelector<HTMLButtonElement>('#btn-restore-defaults');
    const errorMsg = this.modalContainer.querySelector<HTMLElement>('#modal-error-msg');

    const handleClose = () => {
      this.modalContainer.innerHTML = '';
      this.callbacks.onClose();
    };

    if (btnClose) btnClose.addEventListener('click', handleClose);
    if (btnCancel) btnCancel.addEventListener('click', handleClose);

    if (btnRestore) {
      btnRestore.addEventListener('click', () => {
        const inMinT = this.modalContainer.querySelector<HTMLInputElement>('#input-min-temp');
        const inMaxT = this.modalContainer.querySelector<HTMLInputElement>('#input-max-temp');
        const inMinH = this.modalContainer.querySelector<HTMLInputElement>('#input-min-hum');
        const inMaxH = this.modalContainer.querySelector<HTMLInputElement>('#input-max-hum');
        if (inMinT && inMaxT && inMinH && inMaxH) {
          inMinT.value = defaults.minTemp.toString();
          inMaxT.value = defaults.maxTemp.toString();
          inMinH.value = defaults.minHum.toString();
          inMaxH.value = defaults.maxHum.toString();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inMinT = this.modalContainer.querySelector<HTMLInputElement>('#input-min-temp');
        const inMaxT = this.modalContainer.querySelector<HTMLInputElement>('#input-max-temp');
        const inMinH = this.modalContainer.querySelector<HTMLInputElement>('#input-min-hum');
        const inMaxH = this.modalContainer.querySelector<HTMLInputElement>('#input-max-hum');

        if (!inMinT || !inMaxT || !inMinH || !inMaxH) return;

        const minTemp = parseFloat(inMinT.value);
        const maxTemp = parseFloat(inMaxT.value);
        const minHum = parseFloat(inMinH.value);
        const maxHum = parseFloat(inMaxH.value);

        if (isNaN(minTemp) || isNaN(maxTemp) || isNaN(minHum) || isNaN(maxHum)) {
          if (errorMsg) {
            errorMsg.textContent = 'Por favor, informe valores numéricos válidos.';
            errorMsg.classList.remove('hidden');
          }
          return;
        }

        if (minTemp >= maxTemp) {
          if (errorMsg) {
            errorMsg.textContent = 'A temperatura mínima deve ser menor que a máxima.';
            errorMsg.classList.remove('hidden');
          }
          return;
        }

        if (minHum >= maxHum) {
          if (errorMsg) {
            errorMsg.textContent = 'A umidade mínima deve ser menor que a máxima.';
            errorMsg.classList.remove('hidden');
          }
          return;
        }

        const newThresholds: RoomThresholds = { minTemp, maxTemp, minHum, maxHum };
        await this.callbacks.onSave(config, newThresholds);
        handleClose();
      });
    }
  }
}
