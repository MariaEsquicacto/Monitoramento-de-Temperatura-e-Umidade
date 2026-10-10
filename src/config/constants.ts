import { RoomConfig, RoomId } from '../types';

/**
 * Constantes e faixas operacionais padrão para as salas hospitalares.
 * Justificativas técnicas baseadas em normas hospitalares (ABNT NBR 7256 e ASHRAE 170):
 *
 * Sala 1: Equipamentos de Tomografia e Ressonância Magnética exigem temperaturas estáveis
 * entre 19°C e 23°C para evitar descalibração de detectores semicondutores e superaquecimento
 * dos computadores de reconstrução de imagem. A umidade entre 40% e 60% previne descargas
 * eletrostáticas em circuitos de alta tensão e evita condensação em bobinas criogênicas.
 *
 * Sala 2: Equipamentos de suporte à vida e armazenamento de materiais estéreis (ventiladores,
 * monitores multiparâmetros) requerem 20°C a 24°C e umidade entre 35% e 60% para integridade
 * das embalagens cirúrgicas e prevenção de proliferação de microrganismos.
 */
export const DEFAULT_ROOM_CONFIGS: Record<RoomId, RoomConfig> = {
  sala_1: {
    roomId: 'sala_1',
    roomName: 'Sala 1: Diagnóstico por Imagem (Tomografia / RM)',
    description: 'Equipamentos sensíveis a superaquecimento e drift térmico nos detectores.',
    thresholds: {
      minTemp: 19.0,
      maxTemp: 23.0,
      minHum: 40.0,
      maxHum: 60.0
    },
    updatedAt: Date.now(),
    updatedBy: 'Sistema (Padrão Médico ABNT NBR 7256)'
  },
  sala_2: {
    roomId: 'sala_2',
    roomName: 'Sala 2: Suporte à Vida e Materiais Estéreis',
    description: 'Ventiladores pulmonares, bombas de infusão e embalagens com barreira estéril.',
    thresholds: {
      minTemp: 20.0,
      maxTemp: 24.0,
      minHum: 35.0,
      maxHum: 60.0
    },
    updatedAt: Date.now(),
    updatedBy: 'Sistema (Padrão Médico ASHRAE 170)'
  }
};

/**
 * Tempo máximo em segundos sem leitura de um sensor antes de ser considerado OFFLINE
 * (Requisito não funcional: detecção de perda de comunicação com o sensor)
 */
export const SENSOR_TIMEOUT_SECONDS = 15;
