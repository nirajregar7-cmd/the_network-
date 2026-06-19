import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

mkdirSync('public/icons', { recursive: true });

function makeSVG(size) {
  const r = Math.round(size * 0.22);
  const s = size;
  const u = s / 100;

  const nx1 = s/2 - u*18;
  const nx2 = s/2 + u*18;
  const ny1 = s/2 - u*22;
  const ny2 = s/2 + u*22;

  const d1x = s/2 + u*30, d1y = s/2 - u*28;
  const d2x = s/2 + u*38, d2y = s/2 - u*14;
  const d3x = s/2 + u*33, d3y = s/2 - u*36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4338CA"/>
      <stop offset="50%" style="stop-color:#6366F1"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.2)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0)"/>
    </radialGradient>
    <clipPath id="clip">
      <rect width="${s}" height="${s}" rx="${r}" ry="${r}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#glow)" clip-path="url(#clip)"/>

  <!-- N strokes -->
  <line x1="${nx1}" y1="${ny2}" x2="${nx1}" y2="${ny1}" stroke="rgba(255,255,255,0.95)" stroke-width="${u*7}" stroke-linecap="round"/>
  <line x1="${nx1}" y1="${ny1}" x2="${nx2}" y2="${ny2}" stroke="rgba(255,255,255,0.95)" stroke-width="${u*7}" stroke-linecap="round"/>
  <line x1="${nx2}" y1="${ny2}" x2="${nx2}" y2="${ny1}" stroke="rgba(255,255,255,0.95)" stroke-width="${u*7}" stroke-linecap="round"/>

  <!-- N corner nodes -->
  <circle cx="${nx1}" cy="${ny1}" r="${u*5.5}" fill="white"/>
  <circle cx="${nx1}" cy="${ny2}" r="${u*5.5}" fill="white"/>
  <circle cx="${nx2}" cy="${ny1}" r="${u*5.5}" fill="white"/>
  <circle cx="${nx2}" cy="${ny2}" r="${u*5.5}" fill="white"/>

  <!-- Floating network dots -->
  <line x1="${d1x}" y1="${d1y}" x2="${d2x}" y2="${d2y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5}"/>
  <line x1="${d1x}" y1="${d1y}" x2="${d3x}" y2="${d3y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5}"/>
  <line x1="${d2x}" y1="${d2y}" x2="${d3x}" y2="${d3y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5}"/>
  <circle cx="${d1x}" cy="${d1y}" r="${u*3.5}" fill="rgba(255,255,255,0.7)"/>
  <circle cx="${d2x}" cy="${d2y}" r="${u*2.5}" fill="rgba(255,255,255,0.6)"/>
  <circle cx="${d3x}" cy="${d3y}" r="${u*2.5}" fill="rgba(255,255,255,0.6)"/>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

for (const size of sizes) {
  const svg = Buffer.from(makeSVG(size));
  const outName = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
  await sharp(svg).png().toFile(join('public/icons', outName));
  console.log(`✓ ${outName}`);
}

// Favicon 32x32
await sharp(Buffer.from(makeSVG(32))).png().toFile('public/favicon.png');
console.log('✓ favicon.png');

// Also write the SVG source
writeFileSync('public/icons/icon.svg', makeSVG(512));
console.log('✓ icon.svg');

console.log('\nAll icons generated!');
