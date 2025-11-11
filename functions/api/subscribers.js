/**
 * Cloudflare Pages Function to view/export newsletter subscribers
 * Protected by API key authentication
 *
 * Required Environment Variables:
 * - ADMIN_API_KEY: Secret key for authentication
 *
 * Required D1 Binding:
 * - DB: D1 database binding
 *
 * Usage:
 * GET /api/subscribers?key=YOUR_ADMIN_API_KEY
 * GET /api/subscribers?key=YOUR_ADMIN_API_KEY&format=csv
 * GET /api/subscribers?key=YOUR_ADMIN_API_KEY&confirmed=1
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Check authentication
  const apiKey = url.searchParams.get('key');
  if (!apiKey || !env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Check if DB is available
  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Build query based on filters
    const confirmedFilter = url.searchParams.get('confirmed');
    const unsubscribedFilter = url.searchParams.get('unsubscribed');
    const format = url.searchParams.get('format') || 'json';

    let query = 'SELECT id, email, subscribed_at, confirmed, confirmed_at, unsubscribed, unsubscribed_at FROM subscribers WHERE 1=1';
    const bindings = [];

    if (confirmedFilter !== null) {
      query += ' AND confirmed = ?';
      bindings.push(confirmedFilter === '1' ? 1 : 0);
    }

    if (unsubscribedFilter !== null) {
      query += ' AND unsubscribed = ?';
      bindings.push(unsubscribedFilter === '1' ? 1 : 0);
    }

    query += ' ORDER BY subscribed_at DESC';

    // Execute query
    let stmt = env.DB.prepare(query);
    if (bindings.length > 0) {
      stmt = stmt.bind(...bindings);
    }

    const result = await stmt.all();
    const subscribers = result.results || [];

    // Return based on format
    if (format === 'csv') {
      // Generate CSV
      const headers = ['id', 'email', 'subscribed_at', 'confirmed', 'confirmed_at', 'unsubscribed', 'unsubscribed_at'];
      const csvRows = [headers.join(',')];

      subscribers.forEach(sub => {
        const row = headers.map(header => {
          const value = sub[header];
          // Escape commas and quotes in CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON
      return new Response(
        JSON.stringify({
          success: true,
          count: subscribers.length,
          subscribers: subscribers
        }, null, 2),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Query error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred while fetching subscribers'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
