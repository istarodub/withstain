# Newsletter Quick Start Guide

## 🚀 Setup (One-time)

### 1. Create D1 Database
```bash
npx wrangler d1 create withstain-subscribers
npx wrangler d1 execute withstain-subscribers --file=./schema.sql
```

### 2. Configure Cloudflare Pages

**Go to:** Cloudflare Dashboard → Pages → withstain → Settings

**Add D1 Binding:**
- Settings → Functions → D1 database bindings → Add binding
- Variable name: `DB`
- D1 database: `withstain-subscribers`

**Add Environment Variables:**
- `ADMIN_API_KEY` = Generate with: `openssl rand -base64 32`
- `RESEND_API_KEY` = (Optional) From https://resend.com
- `NOTIFICATION_EMAIL` = (Optional) Your email for notifications

### 3. Deploy
```bash
git add .
git commit -m "Add newsletter signup with D1"
git push
```

---

## 📊 Daily Use

### View Subscribers
```bash
# Via CLI
npx wrangler d1 execute withstain-subscribers --command "SELECT email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC LIMIT 10"

# Via API (in browser)
https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY
```

### Export to CSV
```bash
# Via API (in browser)
https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY&format=csv
```

### Count Subscribers
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT COUNT(*) as total FROM subscribers WHERE unsubscribed = 0"
```

---

## 🔧 Common Tasks

### Check Recent Signups (Last 24 hours)
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT email, subscribed_at FROM subscribers WHERE datetime(subscribed_at) > datetime('now', '-1 day') ORDER BY subscribed_at DESC"
```

### Mark Email as Confirmed
```bash
npx wrangler d1 execute withstain-subscribers --command "UPDATE subscribers SET confirmed = 1, confirmed_at = datetime('now') WHERE email = 'user@example.com'"
```

### View Stats
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT COUNT(*) as total, SUM(confirmed) as confirmed, SUM(unsubscribed) as unsubscribed FROM subscribers"
```

---

## 📁 Files

- `schema.sql` - Database structure
- `functions/api/subscribe.js` - Handle newsletter signups
- `functions/api/subscribers.js` - View/export subscribers (admin only)
- `src/subscribe.njk` - Signup form page
- `D1_SETUP.md` - Full documentation

---

## 🔐 Security

- **Never commit** your `ADMIN_API_KEY` to git
- API endpoint `/api/subscribers` requires authentication
- Subscriber IPs and user agents are stored for fraud prevention
- Email notifications are optional (function works without Resend)

---

## 🐛 Troubleshooting

### "Database not configured"
- Check D1 binding is named `DB` in Cloudflare Pages settings
- Verify database exists: `npx wrangler d1 list`

### "Already subscribed" message
- Email is already in database
- Check: `npx wrangler d1 execute withstain-subscribers --command "SELECT * FROM subscribers WHERE email = 'test@example.com'"`

### Test locally
```bash
npx wrangler pages dev _site --d1 DB=withstain-subscribers
```

Then visit: http://localhost:8788/subscribe/
