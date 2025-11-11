#!/bin/bash

# Withstain Deployment Script for Cloudflare Pages

echo "🚀 Starting Withstain deployment..."

# Build the site
echo "📦 Building site..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloudflare Pages
echo "🌍 Deploying to Cloudflare Pages..."
wrangler pages deploy _site --project-name=withstain

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

echo "✅ Deployment successful!"
echo "🎉 Your site is now live!"
