/**
 * Genera PNG placeholder mínimos para Expo (icon, splash, adaptive).
 * Ejecutar: node scripts/generate-assets.js
 */
const fs = require('fs');
const path = require('path');

// PNG 1x1 rosa (#FFB3D9) válido
const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

for (const name of ['icon.png', 'splash-icon.png', 'adaptive-icon.png']) {
  fs.writeFileSync(path.join(assetsDir, name), MINI_PNG);
  console.log('Created', name);
}
