import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Read the SVG
const svgBuffer = readFileSync(join(iconsDir, 'icon.svg'));

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`  Created icon-${size}x${size}.png`);
  }

  // Generate maskable icon (with padding for safe zone)
  await sharp(svgBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 74, g: 124, b: 89, alpha: 1 }
    })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 74, g: 124, b: 89, alpha: 1 }
    })
    .png()
    .toFile(join(iconsDir, 'maskable-icon-512x512.png'));
  console.log('  Created maskable-icon-512x512.png');

  // Generate badge icon for notifications
  await sharp(svgBuffer)
    .resize(72, 72)
    .png()
    .toFile(join(iconsDir, 'badge-72x72.png'));
  console.log('  Created badge-72x72.png');

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '..', 'public', 'favicon.png'));
  console.log('  Created favicon.png');

  // Generate apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('  Created apple-touch-icon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
