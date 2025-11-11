# Withstain – A Modern Guide to Longevity and Resilience

A modern, evidence-based longevity and resilience website built with Eleventy and deployed on Cloudflare Pages.

## Features

- 🎨 Dark, modern design with Tailwind CSS
- 📧 Newsletter subscription with Cloudflare Pages Functions
- 📱 Fully responsive
- ⚡ Lightning-fast performance
- 🔒 Secure and privacy-focused

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Visit http://localhost:8080
```

### Build

```bash
# Build for production
npm run build

# Output will be in _site/ directory
```

### Deploy to Cloudflare Pages

```bash
# Quick deployment
./deploy.sh

# Or manually
npm run build
wrangler pages deploy _site --project-name=withstain
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
withstain/
├── src/
│   ├── _includes/
│   │   ├── base.njk          # Base layout template
│   │   └── post.njk          # Blog post template
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── posts/                # Blog posts (Markdown)
│   ├── index.njk             # Homepage
│   ├── about.njk             # About page
│   ├── blog.njk              # Blog listing
│   ├── contact.njk           # Contact page
│   └── subscribe.njk         # Newsletter subscription
├── functions/
│   └── api/
│       └── subscribe.js      # Newsletter API endpoint
├── _site/                    # Generated site (git-ignored)
├── .eleventy.js              # Eleventy configuration
├── wrangler.toml             # Cloudflare Pages config
├── package.json
└── README.md
```

## Newsletter Subscription

The site includes a serverless newsletter subscription feature powered by:
- **Cloudflare Pages Functions** - Serverless API endpoint
- **Resend API** - Email delivery (free tier: 3000 emails/month)

### Setup Environment Variables

```bash
# Set via Wrangler CLI
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put NOTIFICATION_EMAIL
```

Or add them in the Cloudflare Dashboard under Settings → Environment Variables.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Writing Posts

Create a new markdown file in `src/posts/` with the following front matter:

```markdown
---
title: "Your Post Title"
description: "A brief description"
date: 2025-01-15
tags: ["longevity", "health"]
layout: post.njk
permalink: "/blog/your-post-slug/"
image: "/images/your-image.jpg"  # Optional
imageCredit: "Photo credit"      # Optional
---

Your content here...
```

## Design System

- **Background**: Zinc-900 (#18181b)
- **Accent**: Lime-300 (#a3e635)
- **Typography**: Montserrat (400, 700, 800)
- **Framework**: Tailwind CSS (CDN)
- **Icons**: Material Icons

## Scripts

- `npm start` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run clean` - Clean _site directory
- `./deploy.sh` - Build and deploy to Cloudflare Pages

## Tech Stack

- **Static Site Generator**: [Eleventy](https://www.11ty.dev/)
- **Templating**: Nunjucks
- **Styling**: Tailwind CSS + Custom CSS
- **Hosting**: Cloudflare Pages
- **Email**: Resend API

## License

MIT

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) or contact support.
