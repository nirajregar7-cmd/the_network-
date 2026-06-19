import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

mkdirSync('public/icons', { recursive: true });

function makeSVG(size, maskable = false) {
  const s = size;
  const u = s / 100;
  // For maskable icons, shrink the safe zone to 80% (standard safe area is the inner 80%)
  const scale = maskable ? 0.72 : 0.82;

  const nx1 = s/2 - u*18*scale;
  const nx2 = s/2 + u*18*scale;
  const ny1 = s/2 - u*22*scale;
  const ny2 = s/2 + u*22*scale;
  const lw = u*7*scale;
  const nr = u*5.5*scale;

  const d1x = s/2 + u*30*scale, d1y = s/2 - u*28*scale;
  const d2x = s/2 + u*38*scale, d2y = s/2 - u*14*scale;
  const d3x = s/2 + u*33*scale, d3y = s/2 - u*36*scale;

  const r = maskable ? 0 : Math.round(s * 0.22);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0533"/>
      <stop offset="40%" style="stop-color:#3730a3"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <radialGradient id="glow" cx="38%" cy="32%" r="65%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="#000000"/>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)" opacity="0.92"/>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#glow)"/>

  <line x1="${nx1}" y1="${ny2}" x2="${nx1}" y2="${ny1}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${nx1}" y1="${ny1}" x2="${nx2}" y2="${ny2}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${nx2}" y1="${ny2}" x2="${nx2}" y2="${ny1}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>

  <circle cx="${nx1}" cy="${ny1}" r="${nr}" fill="white"/>
  <circle cx="${nx1}" cy="${ny2}" r="${nr}" fill="white"/>
  <circle cx="${nx2}" cy="${ny1}" r="${nr}" fill="white"/>
  <circle cx="${nx2}" cy="${ny2}" r="${nr}" fill="white"/>

  <line x1="${d1x}" y1="${d1y}" x2="${d2x}" y2="${d2y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5*scale}"/>
  <line x1="${d1x}" y1="${d1y}" x2="${d3x}" y2="${d3y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5*scale}"/>
  <line x1="${d2x}" y1="${d2y}" x2="${d3x}" y2="${d3y}" stroke="rgba(255,255,255,0.35)" stroke-width="${u*1.5*scale}"/>
  <circle cx="${d1x}" cy="${d1y}" r="${u*3.5*scale}" fill="rgba(255,255,255,0.65)"/>
  <circle cx="${d2x}" cy="${d2y}" r="${u*2.5*scale}" fill="rgba(255,255,255,0.55)"/>
  <circle cx="${d3x}" cy="${d3y}" r="${u*2.5*scale}" fill="rgba(255,255,255,0.55)"/>
</svg>`;
}

// Standard icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const size of sizes) {
  await sharp(Buffer.from(makeSVG(size))).png().toFile(join('public/icons', `icon-${size}x${size}.png`));
  console.log(`✓ icon-${size}x${size}.png`);
}

// Maskable icon (512x512, full-bleed, no rounded corners)
await sharp(Buffer.from(makeSVG(512, true))).png().toFile('public/icons/icon-512x512-maskable.png');
console.log('✓ icon-512x512-maskable.png (maskable)');

// Apple touch icon (180x180, rounded corners for iOS)
await sharp(Buffer.from(makeSVG(180))).png().toFile('public/icons/apple-touch-icon.png');
console.log('✓ apple-touch-icon.png');

// Favicon (32x32)
await sharp(Buffer.from(makeSVG(32))).png().toFile('public/favicon.png');
console.log('✓ favicon.png');

// SVG source
writeFileSync('public/icons/icon.svg', makeSVG(512));
console.log('✓ icon.svg');

console.log('\nAll icons generated with black background!');
