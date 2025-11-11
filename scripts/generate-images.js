#!/usr/bin/env node

/**
 * Withstain Blog Post Image Generator
 *
 * Generates branded images for blog posts:
 * - Thumbnail (350x350) with subtle overlay
 * - Hero image (1200x630) with branded overlay
 * - OG image (1200x630) with title overlay
 *
 * Usage:
 *   node scripts/generate-images.js <input-image> <post-title> [output-dir]
 *
 * Example:
 *   node scripts/generate-images.js source.jpg "Health Optimization Guide" src/images/posts
 */

const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Register Montserrat fonts for canvas rendering - using exact Google Fonts versions
// Note: Register with actual font weight (bold/normal) not CSS weight numbers
registerFont(path.join(__dirname, '../assets/fonts/Montserrat-700.ttf'), { family: 'Montserrat', weight: 'bold' });
registerFont(path.join(__dirname, '../assets/fonts/Montserrat-800.ttf'), { family: 'Montserrat ExtraBold' });

// Design system colors
const COLORS = {
  zinc900: '#18181b',
  zinc800: '#27272a',
  zinc700: '#3f3f46',
  zinc300: '#d4d4d8',
  zinc100: '#fafafa',
  lime300: '#a3e635',
  lime200: '#d9f99d',
};

// Configuration
const CONFIG = {
  thumbnail: { width: 350, height: 350 },
  hero: { width: 1200, height: 630 },
  og: { width: 1200, height: 630 },
  twitter: { width: 800, height: 800 },
};

async function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

async function generateThumbnail(inputPath, outputPath) {
  console.log('📸 Generating thumbnail...');

  await sharp(inputPath)
    .resize(CONFIG.thumbnail.width, CONFIG.thumbnail.height, {
      fit: 'cover',
      position: 'center'
    })
    .composite([{
      input: Buffer.from(`
        <svg width="${CONFIG.thumbnail.width}" height="${CONFIG.thumbnail.height}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${COLORS.zinc900};stop-opacity:0" />
              <stop offset="100%" style="stop-color:${COLORS.zinc900};stop-opacity:0.6" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
        </svg>
      `),
      blend: 'over'
    }])
    .toFile(outputPath);

  console.log(`✅ Thumbnail saved: ${outputPath}`);
}

async function generateHeroImage(inputPath, outputPath) {
  console.log('🖼️  Generating hero image...');

  // Create canvas for overlay - same approach as OG image
  const canvas = createCanvas(CONFIG.hero.width, CONFIG.hero.height);
  const ctx = canvas.getContext('2d');

  // Load and draw background image
  const backgroundImage = await loadImage(inputPath);

  // Calculate dimensions to cover canvas while maintaining aspect ratio
  const imgAspect = backgroundImage.width / backgroundImage.height;
  const canvasAspect = CONFIG.hero.width / CONFIG.hero.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > canvasAspect) {
    drawHeight = CONFIG.hero.height;
    drawWidth = drawHeight * imgAspect;
    offsetX = -(drawWidth - CONFIG.hero.width) / 2;
    offsetY = 0;
  } else {
    drawWidth = CONFIG.hero.width;
    drawHeight = drawWidth / imgAspect;
    offsetX = 0;
    offsetY = -(drawHeight - CONFIG.hero.height) / 2;
  }

  ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

  // Add gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.hero.height);
  gradient.addColorStop(0, COLORS.zinc900 + '66'); // 0.4 opacity
  gradient.addColorStop(0.6, COLORS.zinc900 + '99'); // 0.6 opacity
  gradient.addColorStop(1, COLORS.zinc900 + 'D9'); // 0.85 opacity
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.hero.width, CONFIG.hero.height);

  // Add corner glow
  const radialGrad = ctx.createRadialGradient(150, 150, 0, 150, 150, 250);
  radialGrad.addColorStop(0, COLORS.lime300 + '1F'); // 0.12 opacity
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.beginPath();
  ctx.arc(150, 150, 250, 0, Math.PI * 2);
  ctx.fill();

  // Logo and brand section - matching OG image approach exactly
  const topPadding = 60;
  const leftPadding = 80;
  const logoScale = 0.65;
  const brandingCenterY = topPadding + 16;

  // Draw logo using canvas operations
  ctx.save();
  ctx.translate(leftPadding, brandingCenterY - 16);
  ctx.scale(logoScale, logoScale);
  ctx.fillStyle = COLORS.lime300;
  ctx.globalAlpha = 0.7;

  // Top-right element
  ctx.beginPath();
  ctx.moveTo(42, 14);
  ctx.bezierCurveTo(43.5, 22, 43, 29, 39, 36);
  ctx.bezierCurveTo(35, 42, 28, 47, 21, 48);
  ctx.bezierCurveTo(20, 48, 19, 48, 18, 48);
  ctx.bezierCurveTo(18, 38, 21, 29, 28, 22);
  ctx.bezierCurveTo(31, 19, 37, 14, 42, 14);
  ctx.closePath();
  ctx.fill();

  // Left element
  ctx.beginPath();
  ctx.moveTo(1, 15);
  ctx.bezierCurveTo(10, 16, 18, 22, 21, 26);
  ctx.bezierCurveTo(18, 29, 16, 35, 15, 39);
  ctx.bezierCurveTo(15, 42, 15, 44, 15, 47);
  ctx.bezierCurveTo(13, 46, 12, 46, 12, 45);
  ctx.bezierCurveTo(3, 38, -2, 25, 1, 15);
  ctx.closePath();
  ctx.fill();

  // Center circle
  ctx.beginPath();
  ctx.arc(22, 9, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Add "WITHSTAIN" text - using textBaseline = 'middle' like OG image
  ctx.fillStyle = COLORS.lime300;
  ctx.globalAlpha = 0.7;
  ctx.font = 'bold 24px Montserrat';
  ctx.textBaseline = 'middle'; // Same as OG image
  ctx.letterSpacing = '0.1em'; // tracking-widest in Tailwind
  ctx.fillText('WITHSTAIN', leftPadding + 40, brandingCenterY);

  // Convert canvas to buffer and save with sharp
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.98 });
  await sharp(buffer)
    .jpeg({
      quality: 98,
      mozjpeg: true,
      chromaSubsampling: '4:4:4'
    })
    .toFile(outputPath);

  console.log(`✅ Hero image saved: ${outputPath}`);
}

async function generateOGImage(inputPath, title, outputPath) {
  console.log('🎨 Generating OG image...');

  // Create canvas for text overlay
  const canvas = createCanvas(CONFIG.og.width, CONFIG.og.height);
  const ctx = canvas.getContext('2d');

  // Load and draw background image with proper cover behavior (no stretching)
  const backgroundImage = await loadImage(inputPath);

  // Calculate dimensions to cover canvas while maintaining aspect ratio
  const imgAspect = backgroundImage.width / backgroundImage.height;
  const canvasAspect = CONFIG.og.width / CONFIG.og.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > canvasAspect) {
    // Image is wider - fit to height
    drawHeight = CONFIG.og.height;
    drawWidth = drawHeight * imgAspect;
    offsetX = -(drawWidth - CONFIG.og.width) / 2;
    offsetY = 0;
  } else {
    // Image is taller - fit to width
    drawWidth = CONFIG.og.width;
    drawHeight = drawWidth / imgAspect;
    offsetX = 0;
    offsetY = -(drawHeight - CONFIG.og.height) / 2;
  }

  ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

  // Add stronger gradient overlay for better text readability
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.og.height);
  gradient.addColorStop(0, COLORS.zinc900 + 'DD');
  gradient.addColorStop(1, COLORS.zinc900 + 'F5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.og.width, CONFIG.og.height);

  // Add subtle lime glow accent in top corner
  const radialGrad1 = ctx.createRadialGradient(1100, 100, 0, 1100, 100, 300);
  radialGrad1.addColorStop(0, COLORS.lime300 + '15');
  radialGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad1;
  ctx.fillRect(700, 0, 500, 300);

  // Logo and brand section at top - matching navbar (28x32 logo, 24px text)
  const topPadding = 60;
  const leftPadding = 80;
  const logoScale = 0.65; // Navbar uses 28x32, SVG is 43x49, scale = 28/43 ≈ 0.65
  const brandingCenterY = topPadding + 16; // Vertical center for logo + text alignment

  // Draw full SVG logo using canvas operations
  ctx.save();
  // Logo scaled to match navbar size (28x32)
  // Visual center at ~24 * 0.65 = 15.6
  ctx.translate(leftPadding, brandingCenterY - 16);
  ctx.scale(logoScale, logoScale);
  ctx.fillStyle = COLORS.lime300;

  // Draw the three logo elements
  // These coordinates are simplified from the SVG viewBox (79.888 107.974 43.035 49.000)

  // Top-right element (simplified curve)
  ctx.beginPath();
  ctx.moveTo(42, 14);
  ctx.bezierCurveTo(43.5, 22, 43, 29, 39, 36);
  ctx.bezierCurveTo(35, 42, 28, 47, 21, 48);
  ctx.bezierCurveTo(20, 48, 19, 48, 18, 48);
  ctx.bezierCurveTo(18, 38, 21, 29, 28, 22);
  ctx.bezierCurveTo(31, 19, 37, 14, 42, 14);
  ctx.closePath();
  ctx.fill();

  // Left element (simplified curve)
  ctx.beginPath();
  ctx.moveTo(1, 15);
  ctx.bezierCurveTo(10, 16, 18, 22, 21, 26);
  ctx.bezierCurveTo(18, 29, 16, 35, 15, 39);
  ctx.bezierCurveTo(15, 42, 15, 44, 15, 47);
  ctx.bezierCurveTo(13, 46, 12, 46, 12, 45);
  ctx.bezierCurveTo(3, 38, -2, 25, 1, 15);
  ctx.closePath();
  ctx.fill();

  // Center circle
  ctx.beginPath();
  ctx.arc(22, 9, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Add "WITHSTAIN" text next to logo - matching navbar (24px, Montserrat, uppercase, tracking-widest)
  ctx.fillStyle = COLORS.lime300;
  ctx.font = 'bold 24px Montserrat'; // text-2xl = 24px, bold (700), using Montserrat font
  ctx.textBaseline = 'middle'; // Center-align text vertically
  ctx.letterSpacing = '0.1em'; // tracking-widest in Tailwind
  ctx.fillText('WITHSTAIN', leftPadding + 40, brandingCenterY); // Adjusted for smaller logo

  // Reset text baseline for title and other text
  ctx.textBaseline = 'alphabetic';

  // Add title with better spacing
  ctx.fillStyle = COLORS.zinc100;
  ctx.font = '64px "Montserrat ExtraBold"'; // Extrabold (800) like site headings

  const maxTitleWidth = CONFIG.og.width - (leftPadding * 2);
  const lines = await wrapText(ctx, title, maxTitleWidth);
  const lineHeight = 75;
  const titleStartY = topPadding + 120;

  lines.forEach((line, index) => {
    ctx.fillText(line, leftPadding, titleStartY + (index * lineHeight));
  });

  // Add decorative accent line below title
  const accentY = titleStartY + (lines.length * lineHeight) + 40;
  ctx.fillStyle = COLORS.lime300;
  ctx.fillRect(leftPadding, accentY, 160, 4);

  // Add tagline at bottom
  const bottomPadding = 60;
  ctx.fillStyle = COLORS.zinc300;
  ctx.font = '22px Montserrat';
  ctx.fillText('Evidence-based longevity through modern science', leftPadding, CONFIG.og.height - bottomPadding);

  // Convert canvas to buffer and save with sharp
  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .png({
      quality: 100,
      compressionLevel: 6, // 0-9, lower = better quality but larger file
      adaptiveFiltering: true
    })
    .toFile(outputPath);

  console.log(`✅ OG image saved: ${outputPath}`);
}

async function generateTwitterOGImage(inputPath, title, outputPath) {
  console.log('🐦 Generating Twitter OG image (square)...');

  // Create canvas for text overlay
  const canvas = createCanvas(CONFIG.twitter.width, CONFIG.twitter.height);
  const ctx = canvas.getContext('2d');

  // Load and draw background image with proper cover behavior (no stretching)
  const backgroundImage = await loadImage(inputPath);

  // Calculate dimensions to cover canvas while maintaining aspect ratio
  const imgAspect = backgroundImage.width / backgroundImage.height;
  const canvasAspect = CONFIG.twitter.width / CONFIG.twitter.height; // 1:1

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > canvasAspect) {
    // Image is wider - fit to height
    drawHeight = CONFIG.twitter.height;
    drawWidth = drawHeight * imgAspect;
    offsetX = -(drawWidth - CONFIG.twitter.width) / 2;
    offsetY = 0;
  } else {
    // Image is taller - fit to width
    drawWidth = CONFIG.twitter.width;
    drawHeight = drawWidth / imgAspect;
    offsetX = 0;
    offsetY = -(drawHeight - CONFIG.twitter.height) / 2;
  }

  ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

  // Add stronger gradient overlay for better text readability
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.twitter.height);
  gradient.addColorStop(0, COLORS.zinc900 + 'DD');
  gradient.addColorStop(1, COLORS.zinc900 + 'F5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.twitter.width, CONFIG.twitter.height);

  // Add subtle lime glow accent in top corner
  const radialGrad1 = ctx.createRadialGradient(700, 80, 0, 700, 80, 250);
  radialGrad1.addColorStop(0, COLORS.lime300 + '15');
  radialGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad1;
  ctx.fillRect(500, 0, 300, 250);

  // Logo and brand section at top - scaled for 800x800
  const topPadding = 50;
  const leftPadding = 60;
  const logoScale = 0.55; // Slightly smaller for square format
  const brandingCenterY = topPadding + 14;

  // Draw full SVG logo using canvas operations
  ctx.save();
  ctx.translate(leftPadding, brandingCenterY - 14);
  ctx.scale(logoScale, logoScale);
  ctx.fillStyle = COLORS.lime300;

  // Draw the three logo elements
  // Top-right element (simplified curve)
  ctx.beginPath();
  ctx.moveTo(42, 14);
  ctx.bezierCurveTo(43.5, 22, 43, 29, 39, 36);
  ctx.bezierCurveTo(35, 42, 28, 47, 21, 48);
  ctx.bezierCurveTo(20, 48, 19, 48, 18, 48);
  ctx.bezierCurveTo(18, 38, 21, 29, 28, 22);
  ctx.bezierCurveTo(31, 19, 37, 14, 42, 14);
  ctx.closePath();
  ctx.fill();

  // Left element (simplified curve)
  ctx.beginPath();
  ctx.moveTo(1, 15);
  ctx.bezierCurveTo(10, 16, 18, 22, 21, 26);
  ctx.bezierCurveTo(18, 29, 16, 35, 15, 39);
  ctx.bezierCurveTo(15, 42, 15, 44, 15, 47);
  ctx.bezierCurveTo(13, 46, 12, 46, 12, 45);
  ctx.bezierCurveTo(3, 38, -2, 25, 1, 15);
  ctx.closePath();
  ctx.fill();

  // Center circle
  ctx.beginPath();
  ctx.arc(22, 9, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Add "WITHSTAIN" text next to logo
  ctx.fillStyle = COLORS.lime300;
  ctx.font = 'bold 20px Montserrat'; // Slightly smaller for square format, bold (700)
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '0.1em'; // tracking-widest in Tailwind
  ctx.fillText('WITHSTAIN', leftPadding + 35, brandingCenterY);

  // Reset text baseline for title
  ctx.textBaseline = 'alphabetic';

  // Add title with better spacing for square format
  ctx.fillStyle = COLORS.zinc100;
  ctx.font = '52px "Montserrat ExtraBold"'; // Extrabold (800) like site headings, smaller for square format

  const maxTitleWidth = CONFIG.twitter.width - (leftPadding * 2);
  const lines = await wrapText(ctx, title, maxTitleWidth);
  const lineHeight = 62;
  const titleStartY = topPadding + 100;

  lines.forEach((line, index) => {
    ctx.fillText(line, leftPadding, titleStartY + (index * lineHeight));
  });

  // Add decorative accent line below title
  const accentY = titleStartY + (lines.length * lineHeight) + 35;
  ctx.fillStyle = COLORS.lime300;
  ctx.fillRect(leftPadding, accentY, 120, 4);

  // Add tagline at bottom
  const bottomPadding = 50;
  ctx.fillStyle = COLORS.zinc300;
  ctx.font = '18px Montserrat';
  ctx.fillText('Evidence-based longevity through modern science', leftPadding, CONFIG.twitter.height - bottomPadding);

  // Convert canvas to buffer and save with sharp
  const buffer = canvas.toBuffer('image/png');
  await sharp(buffer)
    .png({
      quality: 100,
      compressionLevel: 6,
      adaptiveFiltering: true
    })
    .toFile(outputPath);

  console.log(`✅ Twitter OG image saved: ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate-images.js <input-image> <post-title> [output-dir] [slug]');
    console.error('Example: node scripts/generate-images.js source.jpg "Health Optimization" src/images/posts my-slug');
    process.exit(1);
  }

  const [inputPath, title, outputDir = 'src/images/posts', customSlug] = args;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input image not found: ${inputPath}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }

  // Use custom slug if provided, otherwise generate from title
  const slug = customSlug || title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const thumbnailPath = path.join(outputDir, `${slug}-thumb.jpg`);
  const heroPath = path.join(outputDir, `${slug}-hero.jpg`);
  const ogPath = path.join(outputDir, `${slug}-og.png`);
  const twitterPath = path.join(outputDir, `${slug}-twitter.png`);

  console.log('\n🚀 Starting image generation...\n');
  console.log(`Input: ${inputPath}`);
  console.log(`Title: ${title}`);
  console.log(`Output directory: ${outputDir}\n`);

  try {
    await generateThumbnail(inputPath, thumbnailPath);
    await generateHeroImage(inputPath, heroPath);
    await generateOGImage(inputPath, title, ogPath);
    await generateTwitterOGImage(inputPath, title, twitterPath);

    console.log('\n✨ All images generated successfully!\n');
    console.log('Generated files:');
    console.log(`  📸 Thumbnail:    ${thumbnailPath}`);
    console.log(`  🖼️  Hero:        ${heroPath}`);
    console.log(`  🎨 OG Image:     ${ogPath}`);
    console.log(`  🐦 Twitter Card: ${twitterPath}\n`);

    console.log('Next steps:');
    console.log('1. Add images to your blog post frontmatter:');
    console.log('   ---');
    console.log('   title: "' + title + '"');
    console.log('   image: "/images/posts/' + slug + '-hero.jpg"');
    console.log('   ogImage: "/images/posts/' + slug + '-og.png"');
    console.log('   twitterImage: "/images/posts/' + slug + '-twitter.png"');
    console.log('   ---\n');

  } catch (error) {
    console.error('\n❌ Error generating images:', error.message);
    process.exit(1);
  }
}

main();
