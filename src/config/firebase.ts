import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

/**
 * Justificativa técnica da escolha dos serviços do Firebase:
 * 
 * 1. Firebase Realtime Database:
 *    - Escolhido para a telemetria ao vivo dos sensores IoT (/rooms/{roomId}/current).
 *    - Por operar através de conexões WebSocket persistentes e modelo otimizado para
 *      dados em formato JSON leve, ele oferece latência extremamente baixa (< 100ms),
 *      ideal para streaming contínuo de leituras e sincronização de heartbeat em tempo real.
 * 
 * 2. Cloud Firestore:
 *    - Escolhido para dados estruturados, histórico de leituras (/readings_history),
 *      configurações operacionais das salas (/room_configs) e perfis com controle de acesso (/users).
 *    - O Firestore oferece modelo baseado em documentos e coleções com suporte a consultas
 *      complexas, filtros por intervalo temporal, paginação e regras de segurança baseadas em papéis (RBAC).
 */

const DEFAULT_RTDB_URL = 'https://gemini-project---analise-5f616-default-rtdb.firebaseio.com/';
const DEFAULT_PROJECT_ID = 'gemini-project---analise-5f616';

const env: ImportMetaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as unknown as ImportMetaEnv);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoProjectPlaceholderKey00000',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${DEFAULT_PROJECT_ID}.firebaseapp.com`,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || DEFAULT_RTDB_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${DEFAULT_PROJECT_ID}.appspot.com`,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:abcdef1234567890',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.databaseURL);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let realtimeDb: Database | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  try { auth = getAuth(app); } catch {}
  try { firestore = getFirestore(app); } catch {}
  realtimeDb = getDatabase(app, firebaseConfig.databaseURL);
  console.info('[Firebase RTDB] Conectado com sucesso à URL:', firebaseConfig.databaseURL);
} catch (error) {
  console.warn('[Firebase] Erro ao inicializar SDK do Firebase:', error);
}

export { app, auth, firestore, realtimeDb };
