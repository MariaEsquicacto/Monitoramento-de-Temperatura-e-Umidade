import { UserRole } from '../types';

export interface AuthModalCallbacks {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, role: UserRole) => Promise<void>;
  onQuickDemoLogin: (role: UserRole) => void;
  onClose: () => void;
}

/**
 * View: Modal de Autenticação (Login, Cadastro e Alternância Rápida para Testes).
 */
export class AuthModalView {
  private modalContainer: HTMLElement;
  private callbacks: AuthModalCallbacks;
  private isRegisterMode = false;

  constructor(modalContainer: HTMLElement, callbacks: AuthModalCallbacks) {
    this.modalContainer = modalContainer;
    this.callbacks = callbacks;
  }

  public open(): void {
    this.render();
  }

  private render(): void {
    this.modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
        <div class="glass-panel-glow bg-[#0E1626] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
          
          <!-- Cabeçalho -->
          <div class="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 class="font-bold text-base text-white">
                ${this.isRegisterMode ? 'Cadastro de Usuário Hospitalar' : 'Acesso ao MedTrack IoT'}
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                ${this.isRegisterMode ? 'Crie uma nova conta no Firebase Authentication' : 'Informe suas credenciais ou use o acesso rápido demonstrativo'}
              </p>
            </div>

            <button id="btn-auth-close" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Acesso Rápido para Avaliação/Testes Imediatos -->
          <div class="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Acesso Rápido para Testes:</span>
            <div class="grid grid-cols-2 gap-2">
              <button id="btn-demo-admin" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all text-center">
                ★ Entrar como Admin
              </button>
              <button id="btn-demo-viewer" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-center">
                Entrar como Comum
              </button>
            </div>
          </div>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
            <div class="relative flex justify-center text-[10px] uppercase font-mono text-slate-500"><span class="bg-[#0E1626] px-2">ou com e-mail/senha</span></div>
          </div>

          <!-- Formulário -->
          <form id="form-auth" class="space-y-3.5">
            <div>
              <label class="block text-xs text-slate-400 mb-1">E-mail Profissional</label>
              <input type="email" id="input-email" required placeholder="engenharia@hospital.org"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-hospital-500" />
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">Senha de Acesso</label>
              <input type="password" id="input-password" required placeholder="••••••••"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-hospital-500" />
            </div>

            ${this.isRegisterMode ? `
              <div>
                <label class="block text-xs text-slate-400 mb-1">Nível de Permissão (RBAC)</label>
                <select id="select-role" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-hospital-500">
                  <option value="viewer">Usuário Comum (Apenas Leitura)</option>
                  <option value="admin">Administrador (Controle Total & Faixas)</option>
                </select>
              </div>
            ` : ''}

            <div id="auth-error" class="hidden text-xs text-rose-400 font-medium"></div>

            <button type="submit" id="btn-submit-auth" class="w-full py-2.5 rounded-lg text-xs font-semibold bg-hospital-600 hover:bg-hospital-500 text-white transition-all shadow-md shadow-hospital-600/30">
              ${this.isRegisterMode ? 'Cadastrar Usuário' : 'Entrar na Aplicação'}
            </button>
          </form>

          <!-- Alternar Modo Login/Cadastro -->
          <div class="mt-4 text-center">
            <button id="btn-toggle-mode" class="text-xs text-slate-400 hover:text-hospital-400 transition-colors">
              ${this.isRegisterMode ? 'Já possui conta? Clique para Entrar' : 'Não possui cadastro? Criar nova conta'}
            </button>
          </div>

        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const btnClose = this.modalContainer.querySelector('#btn-auth-close');
    const form = this.modalContainer.querySelector<HTMLFormElement>('#form-auth');
    const btnToggle = this.modalContainer.querySelector('#btn-toggle-mode');
    const btnDemoAdmin = this.modalContainer.querySelector('#btn-demo-admin');
    const btnDemoViewer = this.modalContainer.querySelector('#btn-demo-viewer');
    const errorBox = this.modalContainer.querySelector<HTMLElement>('#auth-error');

    const handleClose = () => {
      this.modalContainer.innerHTML = '';
      this.callbacks.onClose();
    };

    if (btnClose) btnClose.addEventListener('click', handleClose);

    if (btnDemoAdmin) {
      btnDemoAdmin.addEventListener('click', () => {
        this.callbacks.onQuickDemoLogin('admin');
        handleClose();
      });
    }

    if (btnDemoViewer) {
      btnDemoViewer.addEventListener('click', () => {
        this.callbacks.onQuickDemoLogin('viewer');
        handleClose();
      });
    }

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        this.isRegisterMode = !this.isRegisterMode;
        this.render();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inEmail = this.modalContainer.querySelector<HTMLInputElement>('#input-email');
        const inPass = this.modalContainer.querySelector<HTMLInputElement>('#input-password');
        const selectRole = this.modalContainer.querySelector<HTMLSelectElement>('#select-role');

        if (!inEmail || !inPass) return;

        try {
          if (this.isRegisterMode) {
            const role = (selectRole?.value as UserRole) || 'viewer';
            await this.callbacks.onRegister(inEmail.value, inPass.value, role);
          } else {
            await this.callbacks.onLogin(inEmail.value, inPass.value);
          }
          handleClose();
        } catch (err: unknown) {
          if (errorBox) {
            const message = err instanceof Error ? err.message : 'Falha na autenticação';
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
          }
        }
      });
    }
  }
}
