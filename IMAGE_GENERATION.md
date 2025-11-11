# Blog Post Image Generation Guide

This guide explains how to generate branded images for your blog posts using the automated image generation script.

## What It Generates

The script creates three branded images from a single source image:

1. **Thumbnail** (350x200px) - For blog listings with subtle gradient overlay
2. **Hero Image** (1200x630px) - For the blog post page with brand overlay
3. **OG Image** (1200x630px) - For social media sharing with title overlay

All images feature the Withstain brand elements:
- Zinc-900 dark overlays
- Lime-300 accents
- Logo watermark
- Consistent styling

## Installation

First, install the required dependencies:

```bash
npm install
```

This will install:
- `sharp` - High-performance image processing
- `canvas` - For text and graphic overlays

## Usage

### Basic Usage

```bash
npm run generate-images <source-image> "<post-title>" [output-directory]
```

### Examples

**Example 1: Generate images for a new post**

```bash
npm run generate-images my-photo.jpg "Health Optimization Guide"
```

This will create in `src/images/posts/`:
- `health-optimization-guide-thumb.jpg`
- `health-optimization-guide-hero.jpg`
- `health-optimization-guide-og.png`

**Example 2: Custom output directory**

```bash
npm run generate-images ~/Downloads/fitness.png "Building Muscle After 40" src/images/fitness
```

**Example 3: Long titles**

```bash
npm run generate-images research.jpg "The Science Behind Intermittent Fasting and Longevity"
```

The script automatically wraps long titles in the OG image.

## Step-by-Step Workflow

### 1. Prepare Your Source Image

Requirements:
- **Format**: JPG, PNG, or WebP
- **Minimum size**: 1200x630px (larger is better)
- **Quality**: High resolution for best results
- **Aspect ratio**: 16:9 or close to it works best

Tips:
- Use high-quality, well-lit images
- Avoid busy backgrounds (text overlay needs to be readable)
- Center the main subject
- Landscape orientation works best

### 2. Generate Images

```bash
npm run generate-images source-image.jpg "Your Post Title"
```

### 3. Check Output

The script will create three files:

```
src/images/posts/
├── your-post-title-thumb.jpg  (350x200, ~30KB)
├── your-post-title-hero.jpg   (1200x630, ~150KB)
└── your-post-title-og.png     (1200x630, ~200KB)
```

### 4. Add to Blog Post

Update your blog post frontmatter:

```markdown
---
title: "Your Post Title"
description: "Post description"
date: 2025-01-15
layout: post.njk
image: "/images/posts/your-post-title-hero.jpg"
ogImage: "/images/posts/your-post-title-og.png"
---

Your content here...
```

### 5. Build and Deploy

```bash
npm run build
./deploy.sh
```

## Script Options

### Command Line Arguments

1. **source-image** (required) - Path to your source image
2. **post-title** (required) - Title of the blog post (in quotes if it contains spaces)
3. **output-directory** (optional) - Where to save images (default: `src/images/posts`)

### Output Files

- **Thumbnail**: `{slug}-thumb.jpg`
  - Size: 350x200px
  - Format: JPEG (optimized)
  - Use: Blog listing cards

- **Hero**: `{slug}-hero.jpg`
  - Size: 1200x630px
  - Format: JPEG (optimized)
  - Use: Top of blog post page

- **OG Image**: `{slug}-og.png`
  - Size: 1200x630px
  - Format: PNG (with text)
  - Use: Social media sharing

## Design Details

### Thumbnail
- Subtle gradient overlay (bottom)
- Maintains image focus
- Optimized for card views

### Hero Image
- Gradient overlay (top to bottom)
- Logo watermark (top-left)
- Lime-300 accent circle
- Dark enough to make white text readable

### OG Image
- Full overlay with gradient
- Post title in large text (auto-wrapped)
- "WITHSTAIN" brand name
- Tagline at bottom
- Accent line separator

## Troubleshooting

### Error: "Input image not found"

Make sure your image path is correct:

```bash
# Use absolute path
npm run generate-images /home/user/images/photo.jpg "Title"

# Or relative path from project root
npm run generate-images ./source.jpg "Title"
```

### Error: "Cannot install canvas"

Canvas requires system dependencies:

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

### Images look blurry

Use a higher resolution source image (at least 1920x1080px recommended).

### Title doesn't fit in OG image

The script auto-wraps text, but very long titles (>80 characters) may look cramped. Consider shortening the title.

## Advanced Customization

Want to customize the overlays or colors? Edit `scripts/generate-images.js`:

- **Colors**: Change the `COLORS` object
- **Sizes**: Modify the `CONFIG` object
- **Overlays**: Adjust gradient stops and opacity
- **Typography**: Update font sizes in the canvas drawing code

## Tips for Best Results

1. **Source Images**
   - Use high-quality images (1920x1080 or larger)
   - Ensure good contrast and lighting
   - Avoid images that are already dark (overlays add darkness)

2. **Titles**
   - Keep under 60 characters for best fit
   - Use title case for consistency
   - Avoid special characters

3. **Workflow**
   - Generate images before writing the post
   - Keep source images organized in a separate folder
   - Use descriptive filenames

4. **Performance**
   - Optimize source images before processing
   - The script outputs already-optimized images
   - Generated files are ready for web use

## Examples of Good Source Images

✅ **Good:**
- Bright, well-lit photos
- Clear subject matter
- Medium-dark backgrounds (not too light, not too dark)
- Landscape orientation
- 16:9 aspect ratio

❌ **Avoid:**
- Very dark images (overlay will make them darker)
- Very busy backgrounds (distracting with text)
- Portrait orientation
- Low resolution (<1200px width)

## Batch Processing

To process multiple images:

```bash
# Create a script
for file in sources/*.jpg; do
  title=$(basename "$file" .jpg | tr '-' ' ' | sed 's/\b\w/\U&/g')
  npm run generate-images "$file" "$title"
done
```

## Integration with CMS

If you're using a CMS or automated content system, you can call the script programmatically:

```javascript
const { exec } = require('child_process');

function generatePostImages(imagePath, title) {
  return new Promise((resolve, reject) => {
    exec(`node scripts/generate-images.js "${imagePath}" "${title}"`,
      (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      }
    );
  });
}
```

## Support

For issues with:
- **Sharp**: https://sharp.pixelplumbing.com
- **Canvas**: https://github.com/Automattic/node-canvas
- **Image generation script**: Check the source code or create an issue
