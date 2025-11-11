# Environment Variables Setup Guide

This guide explains how to set up environment variables for both local development and production deployment.

## Overview

The newsletter subscription feature requires two environment variables:
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `NOTIFICATION_EMAIL` - The email address where you want to receive subscription notifications

## Local Development

For local development, Cloudflare Pages uses a `.dev.vars` file.

### Step 1: Create .dev.vars file

```bash
# Copy the example file
cp .dev.vars.example .dev.vars
```

### Step 2: Get Resend API Key

1. Go to https://resend.com and sign up (free tier available)
2. Navigate to API Keys section
3. Click "Create API Key"
4. Copy the key (starts with `re_`)

### Step 3: Edit .dev.vars

Open `.dev.vars` in your text editor and fill in your values:

```bash
# .dev.vars
RESEND_API_KEY=re_your_actual_api_key_here
NOTIFICATION_EMAIL=hello@withstain.com
```

### Step 4: Test Locally

```bash
# Build the site
npm run build

# Run local dev server with environment variables
npx wrangler pages dev _site --compatibility-date=2024-01-01
```

Visit http://localhost:8787 and test the subscription form!

### Important Notes for Local Development

- ⚠️ **NEVER commit `.dev.vars` to git** - it's already in `.gitignore`
- The `.dev.vars` file is only for local development
- Cloudflare Pages automatically loads variables from this file when running locally

## Production Deployment

For production on Cloudflare Pages, you have three options:

### Option 1: Using Wrangler CLI (Recommended)

This is the easiest method if you're deploying via CLI:

```bash
# Set RESEND_API_KEY
wrangler pages secret put RESEND_API_KEY
# When prompted, paste your Resend API key

# Set NOTIFICATION_EMAIL
wrangler pages secret put NOTIFICATION_EMAIL
# When prompted, enter your notification email
```

To verify your secrets are set:

```bash
wrangler pages secret list --project-name=withstain
```

### Option 2: Via Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on your **withstain** project
4. Go to **Settings** → **Environment Variables**
5. Click **Add variables**
6. Add both variables:
   - Variable name: `RESEND_API_KEY`
   - Value: (paste your Resend API key)
   - Click **Add variable**

   - Variable name: `NOTIFICATION_EMAIL`
   - Value: (your notification email)
   - Click **Add variable**
7. Click **Save** or **Deploy** to apply changes

### Option 3: During First Deployment

If you haven't deployed yet, you can add them during the deployment process:

```bash
# Deploy with prompt to add environment variables
wrangler pages deploy _site --project-name=withstain
```

Then immediately add the secrets:

```bash
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put NOTIFICATION_EMAIL
```

## Environment-Specific Variables

If you need different values for production vs preview deployments:

### Via Cloudflare Dashboard:

1. Go to **Settings** → **Environment Variables**
2. When adding a variable, select the environment:
   - **Production** - for your main domain
   - **Preview** - for git branch previews
   - **Both** - same value for both

### Via Wrangler CLI:

```bash
# Production only
wrangler pages secret put RESEND_API_KEY --env production

# Preview only
wrangler pages secret put RESEND_API_KEY --env preview
```

## Verifying Setup

### Local Development

After setting up `.dev.vars`, run:

```bash
npm run build
npx wrangler pages dev _site
```

Then test the subscription form at http://localhost:8787/subscribe/

### Production

After deployment, visit your live site and test the subscription form. You should:
1. Receive a success message after submitting
2. Receive an email notification at your `NOTIFICATION_EMAIL`

## Troubleshooting

### "Missing environment variables" error

**Local development:**
- Make sure `.dev.vars` exists and contains both variables
- Check for typos in variable names
- Ensure you're running `wrangler pages dev`, not just `npm start`

**Production:**
- Verify variables are set: `wrangler pages secret list`
- Check Cloudflare Dashboard → Settings → Environment Variables
- After adding variables, you may need to redeploy

### Subscription form not working

1. Check browser console for errors
2. Verify the API endpoint is accessible: `/api/subscribe`
3. Test the API directly:

```bash
curl -X POST https://your-site.pages.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Resend API errors

- Verify your API key is valid at https://resend.com/api-keys
- Check you haven't exceeded free tier limits (100 emails/day, 3000/month)
- Make sure you're using the correct API key format (starts with `re_`)

## Security Best Practices

✅ **DO:**
- Use `.dev.vars` for local development
- Use Wrangler CLI or Dashboard for production
- Keep API keys secret and never commit them
- Rotate API keys periodically
- Use different keys for development and production if possible

❌ **DON'T:**
- Commit `.dev.vars` to git
- Share API keys in public channels
- Hardcode keys in your source code
- Use production keys for local testing

## Alternative Email Services

If you prefer not to use Resend, you can modify `functions/api/subscribe.js` to use:

- **SendGrid**: https://sendgrid.com (100 emails/day free)
- **Mailgun**: https://mailgun.com (5000 emails/month free)
- **Postmark**: https://postmarkapp.com (100 emails/month free)

Just replace the Resend API integration with your preferred service's API.

## Need Help?

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler
- Resend API Docs: https://resend.com/docs
