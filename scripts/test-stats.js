import { calculateMean, calculateMedian, calculateStandardDeviation, calculateMetricStats } from '../src/utils/statistics';

// Teste de cálculo estatístico
const sampleData = [21.0, 21.5, 20.8, 22.0, 21.2, 21.4, 21.1];

const mean = calculateMean(sampleData);
const median = calculateMedian(sampleData);
const stdDev = calculateStandardDeviation(sampleData);
const stats = calculateMetricStats(sampleData);

console.log('--- TESTE ESTATÍSTICO HOSPITALAR ---');
console.log('Amostras:', sampleData);
console.log('Média esperada (~21.28):', mean);
console.log('Mediana esperada (21.20):', median);
console.log('Desvio Padrão amostral (~0.39):', stdDev);
console.log('Stats agrupadas:', stats);

if (Math.abs(mean - 21.29) < 0.05 && median === 21.2 && Math.abs(stdDev - 0.39) < 0.05) {
  console.log('✓ Todos os testes matemáticos passaram com precisão!');
} else {
  console.error('Falha na validação estatística');
  process.exit(1);
}
