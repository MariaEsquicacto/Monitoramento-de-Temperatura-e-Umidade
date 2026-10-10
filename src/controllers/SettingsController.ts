import { RoomConfigModel } from '../models/RoomConfigModel';
import { AuthModel } from '../models/AuthModel';
import { RoomConfigModalView } from '../views/RoomConfigModalView';
import { RoomConfig, RoomId, RoomThresholds } from '../types';

/**
 * Controller de Configurações das Faixas Operacionais.
 * Coordena a edição dos limites das salas pelo Administrador e garante
 * que o Usuário Comum não consiga persistir alterações.
 */
export class SettingsController {
  private roomConfigModel: RoomConfigModel;
  private authModel: AuthModel;
  private modalView: RoomConfigModalView | null = null;

  constructor(roomConfigModel: RoomConfigModel, authModel: AuthModel) {
    this.roomConfigModel = roomConfigModel;
    this.authModel = authModel;
  }

  public setModalView(view: RoomConfigModalView): void {
    this.modalView = view;
  }

  public openConfigModal(roomId: RoomId): void {
    const config = this.roomConfigModel.getConfig(roomId);
    const currentUser = this.authModel.getCurrentUser();
    this.modalView?.open(config, currentUser);
  }

  public async handleSaveThresholds(config: RoomConfig, newThresholds: RoomThresholds): Promise<void> {
    const currentUser = this.authModel.getCurrentUser();

    // Verificação de segurança no Controller: apenas Administradores
    if (!this.authModel.isAdmin()) {
      alert('Ação Bloqueada: Apenas Administradores possuem permissão para alterar as faixas operacionais.');
      return;
    }

    const userEmail = currentUser?.email || 'admin@hospital.org';
    await this.roomConfigModel.updateThresholds(config.roomId, newThresholds, userEmail);
  }
}
