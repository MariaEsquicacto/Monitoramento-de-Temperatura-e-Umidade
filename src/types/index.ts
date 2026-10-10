/**
 * Tipos e interfaces fundamentais do sistema hospitalar de telemetria IoT MedTrack.
 */

export type RoomId = 'sala_1' | 'sala_2';

export interface RoomThresholds {
  minTemp: number; // Limite inferior de temperatura (°C)
  maxTemp: number; // Limite superior de temperatura (°C)
  minHum: number;  // Limite inferior de umidade relativa (%)
  maxHum: number;  // Limite superior de umidade relativa (%)
}

export interface RoomConfig {
  roomId: RoomId;
  roomName: string;
  description: string;
  thresholds: RoomThresholds;
  updatedAt: number;
  updatedBy: string;
}

export interface SensorReading {
  id?: string;
  roomId: RoomId;
  temperature: number; // Temperatura em graus Celsius
  humidity: number;    // Umidade relativa do ar em %
  timestamp: number;   // Epoch timestamp em milissegundos
  sensorStatus?: 'online' | 'offline' | 'warning';
  isAnomaly?: boolean;
}

export interface MetricStats {
  mean: number;       // Média aritmética
  median: number;     // Mediana
  stdDev: number;     // Desvio padrão amostral
  min: number;        // Menor valor registrado no recorte
  max: number;        // Maior valor registrado no recorte
}

export interface RoomStats {
  roomId: RoomId;
  sampleCount: number;
  temperature: MetricStats;
  humidity: MetricStats;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  roomId: RoomId;
  roomName: string;
  metric: 'temperature' | 'humidity' | 'sensor_offline';
  metricLabel: string;
  value: number | string;
  thresholdLimit: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  acknowledged?: boolean;
  isSimulation?: boolean;
}

export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: number;
}
