#!/usr/bin/env node

/**
 * Automated Blog Post Image Processor
 *
 * Scans blog posts and automatically generates missing images from source files.
 * Integrates into the build pipeline.
 *
 * Directory structure:
 *   src/images/sources/post-slug.jpg  <- Place source images here
 *   src/images/posts/                 <- Generated images go here
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const POSTS_DIR = path.join(__dirname, '../src/posts');
const SOURCES_DIR = path.join(__dirname, '../src/images/sources');
const OUTPUT_DIR = path.join(__dirname, '../src/images/posts');

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      frontmatter[key.trim()] = value;
    }
  }

  return frontmatter;
}

// Update frontmatter in markdown file
function updateFrontmatter(filePath, slug) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) return false;

  let frontmatter = match[1];
  let updated = false;

  // Update or add image path
  const heroPath = `/images/posts/${slug}-hero.jpg`;
  const ogPath = `/images/posts/${slug}-og.png`;
  const twitterPath = `/images/posts/${slug}-twitter.png`;

  if (frontmatter.match(/^image:/m)) {
    frontmatter = frontmatter.replace(/^image:.*$/m, `image: ${heroPath}`);
    updated = true;
  } else {
    frontmatter += `\nimage: ${heroPath}`;
    updated = true;
  }

  // Update or add ogImage path
  if (frontmatter.match(/^ogImage:/m)) {
    frontmatter = frontmatter.replace(/^ogImage:.*$/m, `ogImage: ${ogPath}`);
  } else {
    frontmatter += `\nogImage: ${ogPath}`;
    updated = true;
  }

  // Update or add twitterImage path
  if (frontmatter.match(/^twitterImage:/m)) {
    frontmatter = frontmatter.replace(/^twitterImage:.*$/m, `twitterImage: ${twitterPath}`);
  } else {
    frontmatter += `\ntwitterImage: ${twitterPath}`;
    updated = true;
  }

  if (updated) {
    const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatter}\n---`);
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }

  return false;
}

// Generate slug from title or extract from permalink
function generateSlug(frontmatter) {
  // Prefer permalink if available (shorter, user-defined)
  if (frontmatter.permalink) {
    const match = frontmatter.permalink.match(/\/([^/]+)\/?$/);
    if (match) {
      return match[1];
    }
  }

  // Fallback to title-based slug
  return frontmatter.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Check if images exist for a post
function checkImagesExist(slug) {
  const thumb = path.join(OUTPUT_DIR, `${slug}-thumb.jpg`);
  const hero = path.join(OUTPUT_DIR, `${slug}-hero.jpg`);
  const og = path.join(OUTPUT_DIR, `${slug}-og.png`);
  const twitter = path.join(OUTPUT_DIR, `${slug}-twitter.png`);

  return {
    thumb: fs.existsSync(thumb),
    hero: fs.existsSync(hero),
    og: fs.existsSync(og),
    twitter: fs.existsSync(twitter),
    allExist: fs.existsSync(thumb) && fs.existsSync(hero) && fs.existsSync(og) && fs.existsSync(twitter)
  };
}

// Find source image for a post
function findSourceImage(slug) {
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const ext of extensions) {
    const sourcePath = path.join(SOURCES_DIR, `${slug}${ext}`);
    if (fs.existsSync(sourcePath)) {
      return sourcePath;
    }
  }

  return null;
}

// Generate images for a post
async function generateImages(sourceImage, title, slug) {
  console.log(`  🎨 Generating images for: ${title}`);

  const scriptPath = path.join(__dirname, 'generate-images.js');
  const command = `node "${scriptPath}" "${sourceImage}" "${title}" "${OUTPUT_DIR}" "${slug}"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stderr.includes('Debugger')) {
      console.log(`  ⚠️  Warnings: ${stderr}`);
    }
    return true;
  } catch (error) {
    console.error(`  ❌ Error generating images: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🖼️  Blog Post Image Processor\n');

  // Ensure directories exist
  if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
    console.log(`📁 Created sources directory: ${SOURCES_DIR}`);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  // Check if posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('ℹ️  No posts directory found. Skipping image generation.');
    return;
  }

  // Get all markdown files in posts directory
  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.log('ℹ️  No blog posts found. Skipping image generation.');
    return;
  }

  console.log(`📝 Found ${files.length} blog post(s)\n`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter || !frontmatter.title) {
      console.log(`⚠️  Skipping ${file}: No title in frontmatter`);
      skippedCount++;
      continue;
    }

    const title = frontmatter.title;
    const slug = generateSlug(frontmatter);

    console.log(`📄 Processing: ${title}`);

    // Check if images already exist
    const imageStatus = checkImagesExist(slug);

    if (imageStatus.allExist) {
      console.log(`  ✅ All images exist, skipping\n`);
      skippedCount++;
      continue;
    }

    // Find source image
    const sourceImage = findSourceImage(slug);

    if (!sourceImage) {
      console.log(`  ⚠️  No source image found in ${SOURCES_DIR}/${slug}.[jpg|png|webp]`);
      console.log(`  💡 Place a source image there to generate blog images\n`);
      skippedCount++;
      continue;
    }

    console.log(`  📸 Found source: ${path.basename(sourceImage)}`);

    // Generate missing images
    const success = await generateImages(sourceImage, title, slug);

    if (success) {
      console.log(`  ✅ Images generated successfully`);

      // Update frontmatter with image paths
      const updated = updateFrontmatter(filePath, slug);
      if (updated) {
        console.log(`  📝 Updated frontmatter with image paths\n`);
      } else {
        console.log();
      }

      processedCount++;
    } else {
      console.log(`  ❌ Failed to generate images\n`);
      errorCount++;
    }
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('\n📊 Summary:\n');
  console.log(`  ✅ Processed: ${processedCount}`);
  console.log(`  ⏭️  Skipped:   ${skippedCount}`);
  console.log(`  ❌ Errors:    ${errorCount}`);
  console.log(`  📝 Total:     ${files.length}\n`);

  if (processedCount > 0) {
    console.log('💡 Tip: Add generated images to your post frontmatter:');
    console.log('   image: "/images/posts/your-post-slug-hero.jpg"');
    console.log('   ogImage: "/images/posts/your-post-slug-og.png"\n');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
