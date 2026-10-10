import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../config/firebase';
import { RoomId, SensorReading } from '../types';

/**
 * Model de Histórico Estruturado de Leituras.
 * 
 * Justificativa técnica:
 * O Cloud Firestore é o banco de dados selecionado para persistir o histórico
 * porque oferece suporte nativo a consultas filtradas (por sala e timestamp),
 * paginação e agregação, além de garantir persistência durável e de longo prazo
 * para auditoria e relatórios regulatórios de instalações de saúde.
 */
export class HistoryModel {
  private localHistory: Record<RoomId, SensorReading[]> = {
    sala_1: [],
    sala_2: []
  };

  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (isFirebaseConfigured() && firestore) {
      await this.fetchRecentHistoryFromFirestore();
    } else {
      this.generateInitialMockHistory();
    }
  }

  /**
   * Gera uma série histórica inicial com dados realistas para Sala 1 e Sala 2
   * permitindo que estatísticas e gráficos históricos funcionem imediatamente
   */
  private generateInitialMockHistory(): void {
    const now = Date.now();
    const count = 30; // 30 amostras prévias

    // Sala 1 (Tomografia): Normal entre 19 e 23°C, 40 a 60%
    const sala1List: SensorReading[] = [];
    for (let i = count; i >= 0; i--) {
      const time = now - i * 5000;
      const baseTemp = 21.0 + Math.sin(i * 0.4) * 1.2;
      const baseHum = 48.0 + Math.cos(i * 0.3) * 4.0;
      sala1List.push({
        id: `mock-s1-${i}`,
        roomId: 'sala_1',
        temperature: Number(baseTemp.toFixed(1)),
        humidity: Number(baseHum.toFixed(1)),
        timestamp: time,
        sensorStatus: 'online'
      });
    }

    // Sala 2 (Suporte à Vida): Normal entre 20 e 24°C, 35 a 60%
    const sala2List: SensorReading[] = [];
    for (let i = count; i >= 0; i--) {
      const time = now - i * 5000;
      const baseTemp = 22.2 + Math.cos(i * 0.5) * 1.0;
      const baseHum = 44.5 + Math.sin(i * 0.35) * 5.0;
      sala2List.push({
        id: `mock-s2-${i}`,
        roomId: 'sala_2',
        temperature: Number(baseTemp.toFixed(1)),
        humidity: Number(baseHum.toFixed(1)),
        timestamp: time,
        sensorStatus: 'online'
      });
    }

    this.localHistory.sala_1 = sala1List;
    this.localHistory.sala_2 = sala2List;
    this.notify();
  }

  private async fetchRecentHistoryFromFirestore(): Promise<void> {
    if (!firestore) return;

    try {
      const roomIds: RoomId[] = ['sala_1', 'sala_2'];
      for (const id of roomIds) {
        const historyCol = collection(firestore, 'readings_history');
        const q = query(
          historyCol,
          where('roomId', '==', id),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const snap = await getDocs(q);
        const docs: SensorReading[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          docs.push({
            id: docSnap.id,
            roomId: d.roomId,
            temperature: Number(d.temperature),
            humidity: Number(d.humidity),
            timestamp: Number(d.timestamp),
            sensorStatus: 'online'
          });
        });

        if (docs.length > 0) {
          this.localHistory[id] = docs.reverse();
        } else {
          // Se ainda não houver dados no Firestore, popula inicial
          this.generateInitialMockHistory();
        }
      }
      this.notify();
    } catch (err) {
      console.warn('[HistoryModel] Erro ao carregar histórico do Firestore:', err);
      this.generateInitialMockHistory();
    }
  }

  /**
   * Persiste uma leitura de sensor no Firestore e no cache local
   */
  public async recordReading(reading: SensorReading): Promise<void> {
    // Adiciona ao buffer local da sala (mantendo os últimos 100 registros)
    if (!this.localHistory[reading.roomId]) {
      this.localHistory[reading.roomId] = [];
    }

    this.localHistory[reading.roomId].push(reading);
    if (this.localHistory[reading.roomId].length > 100) {
      this.localHistory[reading.roomId].shift();
    }

    this.notify();

    // Persiste no Cloud Firestore
    if (isFirebaseConfigured() && firestore) {
      try {
        const historyCol = collection(firestore, 'readings_history');
        await addDoc(historyCol, {
          roomId: reading.roomId,
          temperature: reading.temperature,
          humidity: reading.humidity,
          timestamp: reading.timestamp
        });
      } catch (err) {
        console.warn('[HistoryModel] Erro ao gravar leitura no Firestore:', err);
      }
    }
  }

  public getHistory(roomId: RoomId, maxItems: number = 50): SensorReading[] {
    const list = this.localHistory[roomId] || [];
    return list.slice(-maxItems);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
