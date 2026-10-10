import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Cria o diretório public/icons se não existir
const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Cria favicon.svg elegante
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17"/>
      <stop offset="100%" stop-color="#131B29"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Fundo com cantos arredondados -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" stroke="#1E293B" stroke-width="8"/>
  
  <!-- Círculo externo tecnológico -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#1E293B" stroke-width="12" stroke-dasharray="16 12"/>
  <circle cx="256" cy="256" r="140" fill="#0E1624" stroke="#14B8A6" stroke-width="4" opacity="0.6"/>

  <!-- Cruz médica hospitalar com gradiente -->
  <rect x="236" y="140" width="40" height="232" rx="10" fill="url(#tealGrad)" opacity="0.3"/>
  <rect x="140" y="236" width="232" height="40" rx="10" fill="url(#tealGrad)" opacity="0.3"/>

  <!-- Linha de pulso ECG e telemetria -->
  <path d="M 120 256 L 190 256 L 210 210 L 235 310 L 265 170 L 295 330 L 320 256 L 392 256"
        fill="none" stroke="#00F0FF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>

  <!-- Indicador de status (ponto de temperatura) -->
  <circle cx="392" cy="256" r="12" fill="#14B8A6" filter="url(#glow)"/>
</svg>`;

fs.writeFileSync(path.resolve('public/favicon.svg'), svgContent, 'utf-8');
console.log('favicon.svg criado com sucesso!');

// Função auxiliar para gerar um arquivo PNG básico sem bibliotecas externas pesadas
// Gera uma imagem PNG válida em buffer puro usando especificações RFC 2083
function createPng(width, height, r, g, b) {
  // Signature PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(2, 9); // color type 2 (Truecolor RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data: height rows, each row begins with 1 filter byte (0) followed by width * 3 bytes
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Gradiente sutil
      const dist = Math.hypot(x - width / 2, y - height / 2);
      const isCenter = dist < (width * 0.35);
      if (isCenter) {
        rawData[pixelOffset] = 20;     // R
        rawData[pixelOffset + 1] = 184; // G
        rawData[pixelOffset + 2] = 166; // B (Teal)
      } else {
        rawData[pixelOffset] = 11;     // R
        rawData[pixelOffset + 1] = 15;  // G
        rawData[pixelOffset + 2] = 23;  // B (#0B0F17)
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcTable = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

let crcTableCache = null;
function getCrcTable() {
  if (crcTableCache) return crcTableCache;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  crcTableCache = table;
  return table;
}

const icon192 = createPng(192, 192, 20, 184, 166);
fs.writeFileSync(path.resolve('public/icons/icon-192x192.png'), icon192);

const icon512 = createPng(512, 512, 20, 184, 166);
fs.writeFileSync(path.resolve('public/icons/icon-512x512.png'), icon512);

fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), icon192);

console.log('Ícones PWA gerados com sucesso!');
