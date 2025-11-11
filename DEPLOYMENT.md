# Cloudflare Pages Deployment Guide

This guide explains how to deploy the Withstain website to Cloudflare Pages using the Wrangler CLI.

## Prerequisites

1. **Node.js and npm** installed on your system
2. **Cloudflare account** - Sign up at https://cloudflare.com
3. **Wrangler CLI** - Install globally:
   ```bash
   npm install -g wrangler
   ```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Site

```bash
npm run build
```

This will generate the static site in the `_site` directory.

### 3. Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 4. Deploy to Cloudflare Pages

```bash
wrangler pages deploy _site --project-name=withstain
```

On first deployment, Wrangler will:
- Create a new Cloudflare Pages project named "withstain"
- Upload all files from the `_site` directory
- Deploy your site and provide a URL (e.g., `https://withstain.pages.dev`)

For subsequent deployments, simply run the same command.

### 5. Set Up Environment Variables (for Newsletter Subscription)

The newsletter subscription feature uses Resend API (free tier: 3000 emails/month).

#### Get a Resend API Key:

1. Sign up at https://resend.com (free tier available)
2. Go to API Keys section
3. Create a new API key
4. Copy the key

#### Add Environment Variables to Cloudflare Pages:

**Via CLI:**
```bash
wrangler pages secret put RESEND_API_KEY
# Paste your Resend API key when prompted

wrangler pages secret put NOTIFICATION_EMAIL
# Enter the email address where you want to receive subscription notifications
```

**Via Dashboard:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your "withstain" project
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `RESEND_API_KEY` - Your Resend API key
   - `NOTIFICATION_EMAIL` - Email to receive subscription notifications (e.g., hello@withstain.com)

### 6. Optional: Set Up Custom Domain

1. In Cloudflare Dashboard, go to your Pages project
2. Click "Custom domains"
3. Add your domain (must be on Cloudflare)
4. Follow the instructions to set up DNS records

## Continuous Deployment

### Automatic Deployments via CLI

Create a simple deployment script `deploy.sh`:

```bash
#!/bin/bash
npm run build
wrangler pages deploy _site --project-name=withstain
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

### Using CI/CD (Optional)

You can also set up GitHub Actions or other CI/CD tools:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: withstain
          directory: _site
```

## Testing Locally

To test the subscription function locally:

```bash
# Install dependencies
npm install

# Set environment variables in .dev.vars file
echo "RESEND_API_KEY=your_resend_api_key" > .dev.vars
echo "NOTIFICATION_EMAIL=your_email@example.com" >> .dev.vars

# Run local dev server
wrangler pages dev _site --compatibility-date=2024-01-01
```

Then visit http://localhost:8788

## Troubleshooting

### Subscription Form Not Working

1. Check that environment variables are set correctly
2. Verify Resend API key is valid
3. Check browser console for errors
4. Verify the `/api/subscribe` endpoint is accessible

### Build Errors

```bash
# Clean and rebuild
rm -rf _site node_modules
npm install
npm run build
```

### Deployment Issues

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler if needed
npm install -g wrangler@latest

# Check authentication
wrangler whoami
```

## Alternative Email Services

If you prefer not to use Resend, you can modify `functions/api/subscribe.js` to use:

- **Mailgun** (free tier: 5000 emails/month)
- **SendGrid** (free tier: 100 emails/day)
- **Cloudflare Email Workers** (forward to your email)
- **Simple webhook** to Zapier/Make/n8n

## Cost

- **Cloudflare Pages**: Free tier includes unlimited bandwidth and requests
- **Resend API**: Free tier includes 3000 emails/month, 100 emails/day
- **Total**: $0/month for small to medium traffic sites

## Support

For issues specific to:
- Cloudflare Pages: https://developers.cloudflare.com/pages
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler
- Resend API: https://resend.com/docs
