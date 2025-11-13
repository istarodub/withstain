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

// Register fonts for canvas rendering - using new editorial design system
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

  // Clean editorial design - subtle vignette for depth
  await sharp(inputPath)
    .resize(CONFIG.thumbnail.width, CONFIG.thumbnail.height, {
      fit: 'cover',
      position: 'center'
    })
    .composite([{
      input: Buffer.from(`
        <svg width="${CONFIG.thumbnail.width}" height="${CONFIG.thumbnail.height}">
          <defs>
            <radialGradient id="vignette" cx="50%" cy="50%">
              <stop offset="0%" style="stop-color:#000000;stop-opacity:0" />
              <stop offset="100%" style="stop-color:#000000;stop-opacity:0.15" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#vignette)"/>
        </svg>
      `),
      blend: 'over'
    }])
    .toFile(outputPath);

  console.log(`✅ Thumbnail saved: ${outputPath}`);
}

async function generateHeroImage(inputPath, outputPath) {
  console.log('🖼️  Generating hero image...');

  // Create canvas for overlay - editorial clean design
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

  // Add white gradient overlay to match editorial design (similar to CSS)
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.hero.height);
  gradient.addColorStop(0, COLORS.background + '99'); // 0.6 opacity
  gradient.addColorStop(0.2, COLORS.background + '4D'); // 0.3 opacity
  gradient.addColorStop(0.4, COLORS.background + '80'); // 0.5 opacity
  gradient.addColorStop(0.6, COLORS.background + 'B3'); // 0.7 opacity
  gradient.addColorStop(0.8, COLORS.background + 'F2'); // 0.95 opacity
  gradient.addColorStop(1, COLORS.background); // 1.0 opacity
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.hero.width, CONFIG.hero.height);

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

  // Add white overlay matching blog post style
  // CSS: linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 20%,
  //      rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.7) 60%,
  //      rgba(255, 255, 255, 0.95) 80%, rgba(255, 255, 255, 1) 100%)
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.og.height);
  gradient.addColorStop(0, COLORS.background + '99');    // 0.6 opacity (60%)
  gradient.addColorStop(0.2, COLORS.background + '4D');  // 0.3 opacity (30%)
  gradient.addColorStop(0.4, COLORS.background + '80');  // 0.5 opacity (50%)
  gradient.addColorStop(0.6, COLORS.background + 'B3');  // 0.7 opacity (70%)
  gradient.addColorStop(0.8, COLORS.background + 'F2');  // 0.95 opacity (95%)
  gradient.addColorStop(1, COLORS.background + 'FF');    // 1.0 opacity (100%)
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.og.width, CONFIG.og.height);

  // Logo and brand section at top
  const topPadding = 60;
  const leftPadding = 80;
  const logoHeight = 28; // Target height for logo (matching navbar)
  const brandingCenterY = topPadding + 16;

  // Load and draw actual logo from assets
  const logoImage = await loadImage(path.join(__dirname, '../src/assets/symbol.png'));
  const logoWidth = (logoImage.width / logoImage.height) * logoHeight;

  ctx.save();
  ctx.drawImage(logoImage, leftPadding, brandingCenterY - (logoHeight / 2), logoWidth, logoHeight);
  ctx.restore();

  // Add "Withstain" text - editorial style
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 24px Merriweather'; // Using Merriweather Black for brand
  ctx.textBaseline = 'middle';
  ctx.fillText('Withstain', leftPadding + logoWidth + 12, brandingCenterY); // 12px gap after logo

  // Reset text baseline for title
  ctx.textBaseline = 'alphabetic';

  // Add title with editorial typography and shadow effect
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 64px Merriweather'; // Merriweather Black for headings

  // Add text shadow matching blog post style (0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2))
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 8;

  const maxTitleWidth = CONFIG.og.width - (leftPadding * 2);
  const lines = await wrapText(ctx, title, maxTitleWidth);
  const lineHeight = 75;
  const titleStartY = topPadding + 120;

  lines.forEach((line, index) => {
    ctx.fillText(line, leftPadding, titleStartY + (index * lineHeight));
  });

  // Reset shadow for other elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Add decorative accent line below title - red accent
  const accentY = titleStartY + (lines.length * lineHeight) + 40;
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(leftPadding, accentY, 160, 4);

  // Add tagline at bottom
  const bottomPadding = 60;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '22px Inter';
  ctx.fillText('Practical, resilient longevity through modern science', leftPadding, CONFIG.og.height - bottomPadding);

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

  // Add white overlay matching blog post style
  // CSS: linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 20%,
  //      rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.7) 60%,
  //      rgba(255, 255, 255, 0.95) 80%, rgba(255, 255, 255, 1) 100%)
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.twitter.height);
  gradient.addColorStop(0, COLORS.background + '99');    // 0.6 opacity (60%)
  gradient.addColorStop(0.2, COLORS.background + '4D');  // 0.3 opacity (30%)
  gradient.addColorStop(0.4, COLORS.background + '80');  // 0.5 opacity (50%)
  gradient.addColorStop(0.6, COLORS.background + 'B3');  // 0.7 opacity (70%)
  gradient.addColorStop(0.8, COLORS.background + 'F2');  // 0.95 opacity (95%)
  gradient.addColorStop(1, COLORS.background + 'FF');    // 1.0 opacity (100%)
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.twitter.width, CONFIG.twitter.height);

  // Logo and brand section at top - scaled for 800x800
  const topPadding = 50;
  const leftPadding = 60;
  const logoHeight = 24; // Slightly smaller for square format
  const brandingCenterY = topPadding + 14;

  // Load and draw actual logo from assets
  const logoImage = await loadImage(path.join(__dirname, '../src/assets/symbol.png'));
  const logoWidth = (logoImage.width / logoImage.height) * logoHeight;

  ctx.save();
  ctx.drawImage(logoImage, leftPadding, brandingCenterY - (logoHeight / 2), logoWidth, logoHeight);
  ctx.restore();

  // Add "Withstain" text - editorial style
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 20px Merriweather'; // Merriweather Black for brand, smaller for square
  ctx.textBaseline = 'middle';
  ctx.fillText('Withstain', leftPadding + logoWidth + 10, brandingCenterY); // 10px gap after logo

  // Reset text baseline for title
  ctx.textBaseline = 'alphabetic';

  // Add title with editorial typography and shadow effect
  ctx.fillStyle = COLORS.text;
  ctx.font = '900 52px Merriweather'; // Merriweather Black, smaller for square format

  // Add text shadow matching blog post style (0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2))
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 8;

  const maxTitleWidth = CONFIG.twitter.width - (leftPadding * 2);
  const lines = await wrapText(ctx, title, maxTitleWidth);
  const lineHeight = 62;
  const titleStartY = topPadding + 100;

  lines.forEach((line, index) => {
    ctx.fillText(line, leftPadding, titleStartY + (index * lineHeight));
  });

  // Reset shadow for other elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Add decorative accent line below title - red accent
  const accentY = titleStartY + (lines.length * lineHeight) + 35;
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(leftPadding, accentY, 120, 4);

  // Add tagline at bottom
  const bottomPadding = 50;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '18px Inter';
  ctx.fillText('Practical, resilient longevity through modern science', leftPadding, CONFIG.twitter.height - bottomPadding);

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
