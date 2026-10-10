/**
 * Utilitários de formatação para data, hora, valores e grandezas físicas.
 */

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

export function formatTimeOnly(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)} °C`;
}

export function formatHumidity(hum: number): string {
  return `${hum.toFixed(1)} %`;
}
