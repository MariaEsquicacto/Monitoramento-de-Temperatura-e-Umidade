import { ref, onValue, set, DatabaseReference } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { SENSOR_TIMEOUT_SECONDS } from '../config/constants';
import { RoomId, SensorReading } from '../types';

/**
 * Model de Telemetria em Tempo Real conectado ao Firebase Realtime Database.
 * 
 * Estrutura mapeada:
 * - /ambiente/sensor1 -> Sala 1: Diagnóstico por Imagem (Tomografia / RM)
 *   - temperatura: number
 *   - umidade: number
 * - /ambiente/sensor2 -> Sala 2: Suporte à Vida e Materiais Estéreis
 *   - temperatura: number
 *   - umidade: number
 * - /controle/lampada -> Controle de iluminação da sala
 */
export class TelemetryModel {
  private currentReadings: Record<RoomId, SensorReading | null> = {
    sala_1: null,
    sala_2: null
  };

  private lampadaState = false;
  private listeners: Array<(readings: Record<RoomId, SensorReading | null>) => void> = [];
  private lampadaListeners: Array<(state: boolean) => void> = [];
  private heartbeatInterval: number | null = null;
  private dbRefs: DatabaseReference[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    if (realtimeDb) {
      this.subscribeRealtimeDb();
    } else {
      // Fallback inicial se o SDK ainda estiver carregando
      this.fetchViaRest();
    }

    this.startHeartbeatWatcher();
  }

  /**
   * Conecta diretamente aos nós /ambiente e /controle do Firebase Realtime Database
   */
  private subscribeRealtimeDb(): void {
    if (!realtimeDb) return;

    // 1. Escuta o nó /ambiente (sensor1 e sensor2)
    const ambienteRef = ref(realtimeDb, 'ambiente');
    this.dbRefs.push(ambienteRef);

    onValue(ambienteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const now = Date.now();

        // Mapeamento Sensor 1 -> Sala 1
        if (val.sensor1) {
          const s1 = val.sensor1;
          this.currentReadings.sala_1 = {
            roomId: 'sala_1',
            temperature: Number(s1.temperatura ?? s1.temperature ?? 0),
            humidity: Number(s1.umidade ?? s1.humidity ?? 0),
            timestamp: now,
            sensorStatus: 'online'
          };
        }

        // Mapeamento Sensor 2 -> Sala 2
        if (val.sensor2) {
          const s2 = val.sensor2;
          this.currentReadings.sala_2 = {
            roomId: 'sala_2',
            temperature: Number(s2.temperatura ?? s2.temperature ?? 0),
            humidity: Number(s2.umidade ?? s2.humidity ?? 0),
            timestamp: now,
            sensorStatus: 'online'
          };
        }

        this.notify();
      }
    }, (error) => {
      console.warn('[TelemetryModel] Erro ao escutar /ambiente no Realtime DB:', error);
      // Fallback via REST API caso ocorra erro no WebSocket
      this.fetchViaRest();
    });

    // 2. Escuta o nó /controle/lampada
    const lampadaRef = ref(realtimeDb, 'controle/lampada');
    this.dbRefs.push(lampadaRef);

    onValue(lampadaRef, (snapshot) => {
      if (snapshot.exists()) {
        this.lampadaState = Boolean(snapshot.val());
        this.notifyLampada();
      }
    }, (err) => {
      console.warn('[TelemetryModel] Erro ao escutar /controle/lampada:', err);
    });
  }

  /**
   * Fallback via REST para leitura imediata
   */
  private async fetchViaRest(): Promise<void> {
    try {
      const res = await fetch('https://gemini-project---analise-5f616-default-rtdb.firebaseio.com/ambiente.json');
      if (res.ok) {
        const val = await res.json();
        const now = Date.now();
        if (val?.sensor1) {
          this.currentReadings.sala_1 = {
            roomId: 'sala_1',
            temperature: Number(val.sensor1.temperatura ?? 0),
            humidity: Number(val.sensor1.umidade ?? 0),
            timestamp: now,
            sensorStatus: 'online'
          };
        }
        if (val?.sensor2) {
          this.currentReadings.sala_2 = {
            roomId: 'sala_2',
            temperature: Number(val.sensor2.temperatura ?? 0),
            humidity: Number(val.sensor2.umidade ?? 0),
            timestamp: now,
            sensorStatus: 'online'
          };
        }
        this.notify();
      }
    } catch (e) {
      console.warn('[TelemetryModel] Falha no fetch REST:', e);
    }
  }

  /**
   * Alterna o estado da lâmpada no Firebase Realtime Database (/controle/lampada)
   */
  public async toggleLampada(): Promise<boolean> {
    const newState = !this.lampadaState;
    this.lampadaState = newState;
    this.notifyLampada();

    if (realtimeDb) {
      try {
        const lampadaRef = ref(realtimeDb, 'controle/lampada');
        await set(lampadaRef, newState);
      } catch (err) {
        console.warn('[TelemetryModel] Erro ao gravar estado da lâmpada no Firebase:', err);
      }
    }
    return newState;
  }

  public getLampadaState(): boolean {
    return this.lampadaState;
  }

  public subscribeLampada(listener: (state: boolean) => void): () => void {
    this.lampadaListeners.push(listener);
    listener(this.lampadaState);
    return () => {
      this.lampadaListeners = this.lampadaListeners.filter(l => l !== listener);
    };
  }

  private notifyLampada(): void {
    for (const listener of this.lampadaListeners) {
      listener(this.lampadaState);
    }
  }

  /**
   * Monitora heartbeat para detecção de sensores inativos
   */
  private startHeartbeatWatcher(): void {
    this.heartbeatInterval = setInterval(() => {
      let statusChanged = false;
      const now = Date.now();
      const roomIds: RoomId[] = ['sala_1', 'sala_2'];

      for (const id of roomIds) {
        const reading = this.currentReadings[id];
        if (reading && reading.sensorStatus === 'online') {
          const diffSeconds = (now - reading.timestamp) / 1000;
          if (diffSeconds > SENSOR_TIMEOUT_SECONDS) {
            reading.sensorStatus = 'offline';
            statusChanged = true;
          }
        }
      }

      if (statusChanged) {
        this.notify();
      }
    }, 3000);
  }

  /**
   * Permite publicação/calibração de leituras na estrutura real
   */
  public async publishReading(reading: SensorReading): Promise<void> {
    const readingWithStatus: SensorReading = {
      ...reading,
      sensorStatus: 'online'
    };

    this.currentReadings[reading.roomId] = readingWithStatus;

    if (realtimeDb) {
      try {
        const sensorKey = reading.roomId === 'sala_1' ? 'sensor1' : 'sensor2';
        const targetRef = ref(realtimeDb, `ambiente/${sensorKey}`);
        await set(targetRef, {
          temperatura: reading.temperature,
          umidade: reading.humidity
        });
      } catch (err) {
        console.warn(`[TelemetryModel] Erro ao gravar telemetria no Realtime DB:`, err);
      }
    }

    this.notify();
  }

  public getCurrentReadings(): Record<RoomId, SensorReading | null> {
    return { ...this.currentReadings };
  }

  public getCurrentReading(roomId: RoomId): SensorReading | null {
    return this.currentReadings[roomId];
  }

  public subscribe(listener: (readings: Record<RoomId, SensorReading | null>) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentReadings);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.currentReadings });
    }
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
