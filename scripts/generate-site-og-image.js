#!/usr/bin/env node

/**
 * Withstain Site OG Image Generator
 *
 * Generates the main OG and Twitter card images for the site homepage.
 * Uses the editorial design system with clean white background.
 *
 * Usage:
 *   node scripts/generate-site-og-image.js
 *
 * Outputs:
 *   - og-image.png (1200x630) - Main OG image
 *   - twitter-image.png (800x800) - Twitter card image
 */

const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Register fonts for canvas rendering - using editorial design system
registerFont(path.join(__dirname, '../assets/fonts/Merriweather-Regular.ttf'), { family: 'Merriweather', weight: 'normal' });
registerFont(path.join(__dirname, '../assets/fonts/Merriweather-Bold.ttf'), { family: 'Merriweather', weight: 'bold' });
registerFont(path.join(__dirname, '../assets/fonts/Merriweather-Black.ttf'), { family: 'Merriweather', weight: '900' });
registerFont(path.join(__dirname, '../assets/fonts/Inter-Regular.ttf'), { family: 'Inter', weight: 'normal' });
registerFont(path.join(__dirname, '../assets/fonts/Inter-Medium.ttf'), { family: 'Inter', weight: '500' });
registerFont(path.join(__dirname, '../assets/fonts/Inter-SemiBold.ttf'), { family: 'Inter', weight: '600' });

// Design system colors - Editorial Design
const COLORS = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  accent: '#C41E3A',
  accentDark: '#A01829',
  border: '#D8D8D8',
  borderDark: '#2A2A2A',
};

// Configuration
const CONFIG = {
  og: { width: 1200, height: 630 },
  twitter: { width: 800, height: 800 },
};

async function generateOGImage(outputPath) {
  console.log('🎨 Generating main OG image...');

  const canvas = createCanvas(CONFIG.og.width, CONFIG.og.height);
  const ctx = canvas.getContext('2d');

  // Clean white background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CONFIG.og.width, CONFIG.og.height);

  // Add subtle decorative elements
  // Top-right accent
  const radialGrad1 = ctx.createRadialGradient(1000, 100, 0, 1000, 100, 300);
  radialGrad1.addColorStop(0, COLORS.accent + '08'); // Very subtle
  radialGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad1;
  ctx.fillRect(700, 0, 500, 300);

  // Bottom-left accent
  const radialGrad2 = ctx.createRadialGradient(200, 530, 0, 200, 530, 250);
  radialGrad2.addColorStop(0, COLORS.accent + '05'); // Even more subtle
  radialGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad2;
  ctx.fillRect(0, 330, 400, 300);

  // Center content vertically
  const centerY = CONFIG.og.height / 2;

  // Load and draw logo
  const logoImage = await loadImage(path.join(__dirname, '../src/assets/symbol.png'));
  const logoHeight = 80;
  const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
  const logoX = (CONFIG.og.width - logoWidth) / 2;
  const logoY = centerY - 120;

  ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

  // Brand name "Withstain"
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 72px Merriweather';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add subtle text shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;

  ctx.fillText('Withstain', CONFIG.og.width / 2, centerY + 20);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Tagline
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '400 24px Inter';
  ctx.fillText('Practical, resilient longevity through modern science', CONFIG.og.width / 2, centerY + 90);

  // Decorative accent line
  ctx.fillStyle = COLORS.accent;
  const lineWidth = 120;
  ctx.fillRect((CONFIG.og.width - lineWidth) / 2, centerY + 130, lineWidth, 3);

  // Convert canvas to buffer and save
  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .png({
      quality: 100,
      compressionLevel: 6,
      adaptiveFiltering: true
    })
    .toFile(outputPath);

  console.log(`✅ OG image saved: ${outputPath}`);
}

async function generateTwitterImage(outputPath) {
  console.log('🐦 Generating Twitter card image...');

  const canvas = createCanvas(CONFIG.twitter.width, CONFIG.twitter.height);
  const ctx = canvas.getContext('2d');

  // Clean white background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CONFIG.twitter.width, CONFIG.twitter.height);

  // Add subtle decorative elements (adjusted for square)
  // Top-right accent
  const radialGrad1 = ctx.createRadialGradient(650, 100, 0, 650, 100, 250);
  radialGrad1.addColorStop(0, COLORS.accent + '08');
  radialGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad1;
  ctx.fillRect(450, 0, 350, 250);

  // Bottom-left accent
  const radialGrad2 = ctx.createRadialGradient(150, 700, 0, 150, 700, 200);
  radialGrad2.addColorStop(0, COLORS.accent + '05');
  radialGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad2;
  ctx.fillRect(0, 550, 300, 250);

  // Center content vertically
  const centerY = CONFIG.twitter.height / 2;

  // Load and draw logo
  const logoImage = await loadImage(path.join(__dirname, '../src/assets/symbol.png'));
  const logoHeight = 70;
  const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
  const logoX = (CONFIG.twitter.width - logoWidth) / 2;
  const logoY = centerY - 110;

  ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

  // Brand name "Withstain"
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 60px Merriweather';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add subtle text shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;

  ctx.fillText('Withstain', CONFIG.twitter.width / 2, centerY + 10);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Tagline (wrapped for square format)
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '400 20px Inter';
  ctx.fillText('Practical, resilient longevity', CONFIG.twitter.width / 2, centerY + 75);
  ctx.fillText('through modern science', CONFIG.twitter.width / 2, centerY + 105);

  // Decorative accent line
  ctx.fillStyle = COLORS.accent;
  const lineWidth = 100;
  ctx.fillRect((CONFIG.twitter.width - lineWidth) / 2, centerY + 140, lineWidth, 3);

  // Convert canvas to buffer and save
  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .png({
      quality: 100,
      compressionLevel: 6,
      adaptiveFiltering: true
    })
    .toFile(outputPath);

  console.log(`✅ Twitter image saved: ${outputPath}`);
}

async function main() {
  console.log('\n🚀 Generating site OG images...\n');

  const ogPath = path.join(__dirname, '../og-image.png');
  const twitterPath = path.join(__dirname, '../twitter-image.png');
  const srcOgPath = path.join(__dirname, '../src/og-image.png');

  try {
    await generateOGImage(ogPath);
    await generateTwitterImage(twitterPath);

    // Copy OG image to src directory for 11ty
    fs.copyFileSync(ogPath, srcOgPath);
    console.log(`✅ Copied OG image to src/og-image.png`);

    console.log('\n✨ All site OG images generated successfully!\n');
    console.log('Generated files:');
    console.log(`  🎨 OG Image (1200x630):     ${ogPath}`);
    console.log(`  🐦 Twitter Card (800x800):  ${twitterPath}`);
    console.log(`  📁 Source copy:             ${srcOgPath}\n`);

  } catch (error) {
    console.error('\n❌ Error generating images:', error.message);
    process.exit(1);
  }
}

main();
