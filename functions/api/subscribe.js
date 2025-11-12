/**
 * Cloudflare Pages Function for newsletter subscription
 * Uses D1 Database for subscriber storage
 * Uses Resend API for email notifications (free tier: 3000 emails/month, 100 emails/day)
 *
 * Required Environment Variables:
 * - RESEND_API_KEY: Your Resend API key from https://resend.com
 * - NOTIFICATION_EMAIL: Email address to receive subscription notifications
 *
 * Required D1 Binding:
 * - DB: D1 database binding (set in Cloudflare Pages settings)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const contentType = request.headers.get('content-type');
    let email;

    if (contentType?.includes('application/json')) {
      const body = await request.json();
      email = body.email;
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      email = formData.get('email');
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email already exists in database
    if (env.DB) {
      try {
        const existingSubscriber = await env.DB.prepare(
          'SELECT email, confirmed, unsubscribed FROM subscribers WHERE email = ?'
        ).bind(email).first();

        if (existingSubscriber) {
          if (existingSubscriber.unsubscribed) {
            // Resubscribe if they previously unsubscribed
            await env.DB.prepare(
              'UPDATE subscribers SET unsubscribed = 0, unsubscribed_at = NULL, subscribed_at = datetime("now"), updated_at = datetime("now") WHERE email = ?'
            ).bind(email).run();
          } else {
            // Already subscribed
            return new Response(
              JSON.stringify({
                success: true,
                message: 'You are already subscribed!'
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        } else {
          // New subscriber - insert into database
          await env.DB.prepare(
            'INSERT INTO subscribers (email, ip_address, user_agent) VALUES (?, ?, ?)'
          ).bind(
            email,
            request.headers.get('CF-Connecting-IP') || null,
            request.headers.get('User-Agent') || null
          ).run();
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if database fails - we'll still send notification
      }
    }

    // Send notification email using Resend API (if configured)
    if (env.RESEND_API_KEY && env.NOTIFICATION_EMAIL) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Withstain Newsletter <onboarding@resend.dev>',
            to: env.NOTIFICATION_EMAIL,
            subject: 'New Newsletter Subscription',
            html: `
              <h2>New Newsletter Subscription</h2>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>IP Address:</strong> ${request.headers.get('CF-Connecting-IP') || 'Unknown'}</p>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error('Resend API error:', errorData);
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Continue even if email fails - subscriber is already in database
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you for subscribing! Look out for our insights in your inbox.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
