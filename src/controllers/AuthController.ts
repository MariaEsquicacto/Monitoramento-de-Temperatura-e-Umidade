import { AuthModel } from '../models/AuthModel';
import { AuthModalView } from '../views/AuthModalView';
import { UserRole } from '../types';

/**
 * Controller de Autenticação e Controle de Acesso (RBAC).
 * Coordena interações entre a visualização de login/cadastro e o AuthModel.
 */
export class AuthController {
  private authModel: AuthModel;
  private authModalView: AuthModalView | null = null;

  constructor(authModel: AuthModel) {
    this.authModel = authModel;
  }

  public setModalView(view: AuthModalView): void {
    this.authModalView = view;
  }

  public openAuthModal(): void {
    this.authModalView?.open();
  }

  public async handleLogin(email: string, pass: string): Promise<void> {
    await this.authModel.login(email, pass);
  }

  public async handleRegister(email: string, pass: string, role: UserRole): Promise<void> {
    await this.authModel.register(email, pass, role);
  }

  public async handleLogout(): Promise<void> {
    await this.authModel.logout();
  }

  public handleSwitchRole(role: UserRole): void {
    this.authModel.switchDemoRole(role);
  }
}
