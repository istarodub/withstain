-- Withstain Newsletter Subscribers Database Schema
-- For Cloudflare D1

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  confirmed BOOLEAN DEFAULT 0,
  confirmed_at TEXT,
  unsubscribed BOOLEAN DEFAULT 0,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Index for filtering by subscription status
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(confirmed, unsubscribed);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_subscribers_date ON subscribers(subscribed_at);
