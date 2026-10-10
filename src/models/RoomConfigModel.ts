import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../config/firebase';
import { DEFAULT_ROOM_CONFIGS } from '../config/constants';
import { RoomConfig, RoomId, RoomThresholds } from '../types';

/**
 * Model para Faixas Operacionais das Salas Médicas.
 * 
 * Justificativa técnica:
 * O Cloud Firestore é utilizado para as configurações de salas por se tratar de
 * dados estruturados que exigem consistência forte e controle de acesso estrito
 * (apenas Administradores podem atualizar). A baixa frequência de alteração e a
 * necessidade de auditoria tornam o modelo de documentos do Firestore ideal.
 */
export class RoomConfigModel {
  private configs: Record<RoomId, RoomConfig> = { ...DEFAULT_ROOM_CONFIGS };
  private listeners: Array<(configs: Record<RoomId, RoomConfig>) => void> = [];
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (isFirebaseConfigured() && firestore) {
      this.subscribeFirestore();
    } else {
      // Carrega do localStorage se houver alterações prévias salvas em demonstração
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('medtrack_room_configs') : null;
      if (saved) {
        try {
          this.configs = JSON.parse(saved);
        } catch {
          this.configs = { ...DEFAULT_ROOM_CONFIGS };
        }
      }
      this.notify();
    }
  }

  private subscribeFirestore(): void {
    if (!firestore) return;

    const roomIds: RoomId[] = ['sala_1', 'sala_2'];

    for (const id of roomIds) {
      const roomRef = doc(firestore, 'room_configs', id);

      // Garante que o documento exista com os limites padrão da norma se estiver vazio
      getDoc(roomRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(roomRef, DEFAULT_ROOM_CONFIGS[id]).catch((err) =>
            console.warn(`[RoomConfigModel] Aviso ao inicializar sala ${id}:`, err)
          );
        }
      });

      // Escuta atualizações em tempo real no Firestore
      onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RoomConfig;
          this.configs[id] = data;
          this.notify();
        }
      }, (error) => {
        console.warn(`[RoomConfigModel] Erro ao sincronizar sala ${id}:`, error);
      });
    }
  }

  public getConfigs(): Record<RoomId, RoomConfig> {
    return { ...this.configs };
  }

  public getConfig(roomId: RoomId): RoomConfig {
    return this.configs[roomId] || DEFAULT_ROOM_CONFIGS[roomId];
  }

  /**
   * Atualiza as faixas operacionais de uma sala.
   * Deve ser executado apenas por Administradores.
   */
  public async updateThresholds(
    roomId: RoomId,
    newThresholds: RoomThresholds,
    userEmail: string
  ): Promise<void> {
    const updatedConfig: RoomConfig = {
      ...this.configs[roomId],
      thresholds: { ...newThresholds },
      updatedAt: Date.now(),
      updatedBy: userEmail
    };

    if (isFirebaseConfigured() && firestore) {
      const roomRef = doc(firestore, 'room_configs', roomId);
      await setDoc(roomRef, updatedConfig);
    } else {
      this.configs[roomId] = updatedConfig;
      localStorage.setItem('medtrack_room_configs', JSON.stringify(this.configs));
      this.notify();
    }
  }

  public subscribe(listener: (configs: Record<RoomId, RoomConfig>) => void): () => void {
    this.listeners.push(listener);
    listener(this.configs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0 && this.unsubscribeFirestore) {
        this.unsubscribeFirestore();
      }
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.configs });
    }
  }
}
