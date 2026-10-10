import { UserProfile } from '../types';
import { isFirebaseConfigured } from '../config/firebase';

export interface NavbarCallbacks {
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchRole: (role: 'admin' | 'viewer') => void;
  onInstallPwa: () => void;
}

/**
 * View: Barra de Navegação Superior.
 * Responsável apenas pela renderização do cabeçalho, status PWA e perfil.
 */
export class NavbarView {
  private container: HTMLElement;
  private callbacks: NavbarCallbacks;
  private canInstallPwa = false;

  constructor(container: HTMLElement, callbacks: NavbarCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public setInstallPromptAvailable(available: boolean): void {
    this.canInstallPwa = available;
    this.render(this.lastProfile);
  }

  private lastProfile: UserProfile | null = null;

  public render(profile: UserProfile | null): void {
    this.lastProfile = profile;
    const isOnline = navigator.onLine;
    const firebaseReady = isFirebaseConfigured();
    const isAdmin = profile?.role === 'admin';

    this.container.innerHTML = `
      <header class="border-b border-telemetry-border bg-[#0E1626]/90 backdrop-blur-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <!-- Logo e Identificação Hospitalar -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-hospital-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-hospital-500/20">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-hospital-300 bg-clip-text text-transparent">MedTrack IoT</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  firebaseReady ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }">
                  ${firebaseReady ? 'Firebase Conectado' : 'Modo Demonstração'}
                </span>
              </div>
              <p class="text-xs text-slate-400 hidden sm:block">Monitoramento de Equipamentos Médicos • Normas NBR 7256 / ASHRAE 170</p>
            </div>
          </div>

          <!-- Status de Rede, Instalação PWA e Usuário -->
          <div class="flex items-center gap-2 sm:gap-4">

            <!-- Indicador PWA Online/Offline -->
            <div id="pwa-status" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${
              isOnline ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950/60 text-rose-300 border border-rose-800/40 animate-pulse'
            }" title="${isOnline ? 'Conectado à Internet (PWA Ativo)' : 'Modo Offline (Cache Local)'}">
              <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
              <span class="hidden md:inline">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <!-- Botão de Instalação PWA -->
            ${this.canInstallPwa ? `
              <button id="btn-install-pwa" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-hospital-600 hover:bg-hospital-500 text-white transition-all shadow-md shadow-hospital-600/30">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Instalar PWA</span>
              </button>
            ` : ''}

            <!-- Badge do Papel do Usuário (RBAC) -->
            ${profile ? `
              <div class="flex items-center gap-2">
                <div class="text-right hidden sm:block">
                  <div class="text-xs font-semibold text-slate-200">${profile.displayName || profile.email}</div>
                  <div class="flex items-center justify-end gap-1">
                    <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAdmin ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                    }">
                      ${isAdmin ? '★ Administrador' : 'Usuário Comum'}
                    </span>
                  </div>
                </div>

                <!-- Botão de Alternância Rápida para Demonstração de Permissões -->
                <button id="btn-quick-toggle-role" title="Alternar papel entre Administrador e Comum para testar regras" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors">
                  <span class="font-mono text-[10px]">${isAdmin ? 'Mudar p/ Comum' : 'Mudar p/ Admin'}</span>
                </button>

                <button id="btn-auth-logout" title="Sair da sessão" class="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ` : `
              <button id="btn-open-login" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-hospital-600 hover:bg-hospital-500 text-white transition-all shadow-md shadow-hospital-600/30">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>Entrar / Cadastrar</span>
              </button>
            `}
          </div>

        </div>
      </header>
    `;

    this.attachEvents(profile);
  }

  private attachEvents(profile: UserProfile | null): void {
    const btnInstall = this.container.querySelector('#btn-install-pwa');
    if (btnInstall) {
      btnInstall.addEventListener('click', () => this.callbacks.onInstallPwa());
    }

    const btnLogin = this.container.querySelector('#btn-open-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', () => this.callbacks.onOpenAuth());
    }

    const btnLogout = this.container.querySelector('#btn-auth-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.callbacks.onLogout());
    }

    const btnToggleRole = this.container.querySelector('#btn-quick-toggle-role');
    if (btnToggleRole && profile) {
      btnToggleRole.addEventListener('click', () => {
        const nextRole = profile.role === 'admin' ? 'viewer' : 'admin';
        this.callbacks.onSwitchRole(nextRole);
      });
    }
  }
}
