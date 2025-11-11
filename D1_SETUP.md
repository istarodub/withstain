# Setting Up D1 Database for Newsletter Subscribers

## 1. Create D1 Database

```bash
# Login to Cloudflare (if not already)
npx wrangler login

# Create the D1 database
npx wrangler d1 create withstain-subscribers
```

This will output something like:
```
✅ Successfully created DB 'withstain-subscribers'!

[[d1_databases]]
binding = "DB"
database_name = "withstain-subscribers"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 2. Save the Database ID

Copy the `database_id` from the output. You'll need it for the next steps.

## 3. Initialize Database Schema

```bash
# Run the schema.sql to create tables
npx wrangler d1 execute withstain-subscribers --file=./schema.sql
```

## 4. Bind D1 to Your Pages Project

### Option A: Via Dashboard (Recommended)
1. Go to Cloudflare Dashboard → Pages
2. Select your `withstain` project
3. Go to Settings → Functions → D1 database bindings
4. Click "Add binding"
5. Variable name: `DB`
6. D1 database: Select `withstain-subscribers`
7. Save

### Option B: Via wrangler.toml (if using Workers)
If you're using Wrangler for deployment, add this to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "withstain-subscribers"
database_id = "your-database-id-here"
```

## 5. Test Locally

```bash
# Start local D1 instance
npx wrangler pages dev _site --d1 DB=withstain-subscribers
```

## 6. Verify Database

```bash
# List all databases
npx wrangler d1 list

# Query your database
npx wrangler d1 execute withstain-subscribers --command "SELECT * FROM subscribers"

# Check table structure
npx wrangler d1 execute withstain-subscribers --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='subscribers'"
```

## 7. Useful Queries

### View all subscribers
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT email, subscribed_at, confirmed FROM subscribers ORDER BY subscribed_at DESC"
```

### Count subscribers
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT COUNT(*) as total FROM subscribers WHERE confirmed = 1 AND unsubscribed = 0"
```

### Export subscribers to CSV
```bash
npx wrangler d1 export withstain-subscribers --output=subscribers.sql
```

## Environment Variables

Set these in Cloudflare Pages → Settings → Environment Variables:

### Required:
- `ADMIN_API_KEY` - Secret key to access subscriber data (generate a random string)

### Optional (for email notifications):
- `RESEND_API_KEY` - Your Resend API key from https://resend.com
- `NOTIFICATION_EMAIL` - Email address to receive new subscriber notifications

**Generate a secure API key:**
```bash
openssl rand -base64 32
```

Add this as `ADMIN_API_KEY` in Cloudflare Pages settings.

## Accessing Subscriber Data

### Via API (after deployment)

**View all subscribers (JSON):**
```
GET https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY
```

**View only confirmed subscribers:**
```
GET https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY&confirmed=1
```

**Export to CSV:**
```
GET https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY&format=csv
```

**Filter out unsubscribed:**
```
GET https://withstain.com/api/subscribers?key=YOUR_ADMIN_API_KEY&confirmed=1&unsubscribed=0
```

### Via Wrangler CLI

**View all subscribers:**
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT email, subscribed_at, confirmed FROM subscribers ORDER BY subscribed_at DESC"
```

**Export to local file:**
```bash
npx wrangler d1 execute withstain-subscribers --command "SELECT * FROM subscribers" --json > subscribers.json
```

## Notes

- D1 free tier: 5 GB storage, 5 million reads/day, 100k writes/day
- Database is SQLite-compatible
- Automatic backups included
- Can export data anytime using `wrangler d1 export`
- API endpoint is protected with `ADMIN_API_KEY` - keep this secret!
- Subscriber data includes: email, timestamp, IP, user agent, confirmation status
