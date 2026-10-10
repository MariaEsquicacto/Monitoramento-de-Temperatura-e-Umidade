import { MetricStats } from '../types';

/**
 * Módulo de cálculos estatísticos sobre séries temporais de sensores hospitalares.
 * Atende ao Requisito 4: média aritmética, mediana e desvio padrão para temperatura e umidade.
 */

/**
 * Calcula a média aritmética de uma lista de valores numéricos.
 * Fórmula: x̄ = (∑ xi) / n
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(2));
}

/**
 * Calcula a mediana de uma lista de valores numéricos.
 * Ordena os elementos e obtém o elemento central (ou a média dos dois centrais se n for par).
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(2));
  } else {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }
}

/**
 * Calcula o desvio padrão amostral de uma lista de valores numéricos.
 * Fórmula: s = √[ (∑ (xi - x̄)²) / (n - 1) ]
 * Se n <= 1, o desvio padrão amostral é 0.
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = calculateMean(values);
  const varianceSum = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = varianceSum / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

/**
 * Gera o conjunto completo de indicadores estatísticos para uma dada métrica.
 */
export function calculateMetricStats(values: number[]): MetricStats {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
  }

  const min = Number(Math.min(...values).toFixed(2));
  const max = Number(Math.max(...values).toFixed(2));

  return {
    mean: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStandardDeviation(values),
    min,
    max
  };
}
