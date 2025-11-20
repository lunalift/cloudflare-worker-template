/**
 * LunaLift Customer Integration - Cloudflare Worker
 *
 * This worker handles complete LunaLift integration:
 * 1. Serves llms.txt from LunaLift CDN (analytics for CDN requests are tracked automatically by LunaLift)
 * 2. Serves .md files from LunaLift CDN (analytics for CDN requests are tracked automatically by LunaLift)
 * 3. Injects schema.json into HTML pages
 * 4. Tracks HTML analytics for LLM bot detection (bots that don't run JavaScript)
 * 5. Injects tracking pixel for AI Overview scroll-to-text (browser-based tracking)
 *
 * Deploy this as a Cloudflare Worker on your domain.
 *
 * Setup:
 * 1. Deploy: wrangler deploy
 * 2. Add route(s) in Cloudflare dashboard or via CLI:
 *    - Dashboard: Workers & Pages > Your Worker > Settings > Triggers > Add route
 *    - CLI: wrangler routes create "example.com/*" --zone-name example.com
 * 3. Done!
 *
 * The worker automatically derives your LunaLift subdomain from your domain:
 * - www.acme.com -> acme-com.lunalift.ai
 * - shop.acme.com -> shop-acme-com.lunalift.ai
 *
 * Important: Your domain must be managed by Cloudflare (nameservers pointing to Cloudflare)
 * for routes to work. If your domain uses a different DNS provider (GoDaddy, Route53, etc.),
 * you'll need to either:
 * - Transfer your domain's nameservers to Cloudflare, OR
 * - Use Cloudflare's Custom Domains feature (add CNAME record from your domain to your workers domain instead of routes)
 */

export default {
  async fetch(request, _env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Auto-generate subdomain from request domain
    // www.acme.com -> acme-com, shop.acme.com -> shop-acme-com
    const customerDomain = request.headers.get('Host');
    const subdomain = customerDomain.replace('www.', '').replace(/\./g, '-');
    const LUNALIFT_CDN = `https://${subdomain}.lunalift.ai`;

    try {
      // 1. Serve llms.txt and .md files from LunaLift CDN (pass-through, no caching)
      // NOTE: If you have your own .md files that should NOT be served from LunaLift,
      // add exclusions here (e.g., path !== '/my-own-docs.md')
      if (path === '/llms.txt' || path.endsWith('.md')) {
        // Pass through to subdomain-router for analytics tracking and caching
        // DO NOT cache here - subdomain-router handles both tracking and caching
        // Forward original request info using same headers as bot-check endpoint
        const cdnHeaders = new Headers();
        cdnHeaders.set('X-Page-URL', url.href);  // Your full URL, like https://yourcompany.com/page.md
        cdnHeaders.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
        cdnHeaders.set('X-Original-User-Agent', request.headers.get('User-Agent') || '');
        cdnHeaders.set('X-Original-Referer', request.headers.get('Referer') || '');

        return await fetch(`${LUNALIFT_CDN}${path}`, {
          headers: cdnHeaders
        });
      }

      // 2. For HTML pages: inject schema.json + tracking pixel
      // Fetch origin HTML
      const originResponse = await fetch(request);

      // Only process HTML responses
      const contentType = originResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return originResponse;
      }

      // Get HTML content
      let html = await originResponse.text();

      // Fetch schema.json from LunaLift CDN
      const schemaPath = path === '/' ? '/.schema.json' : `${path.replace(/\/$/, '')}.schema.json`;
      const schemaResponse = await fetch(`${LUNALIFT_CDN}${schemaPath}`);

      // Replace existing schema.json or inject new one
      if (schemaResponse.ok) {
        const schema = await schemaResponse.json();
        const schemaTag = `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`;

        // Remove any existing ld+json scripts (replace with LunaLift schema)
        html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

        // Inject LunaLift schema
        html = html.replace('</head>', `${schemaTag}\n</head>`);
      }

      // Inject LunaLift tracking pixel (captures AI Overview scroll-to-text)
      // Only inject if not already present
      if (!html.includes('optimize.lunalift.ai/pixel.js')) {
        const pixelTag = '  <script src="https://optimize.lunalift.ai/pixel.js"></script>';
        html = html.replace('</body>', `${pixelTag}\n</body>`);
      }

      // Track analytics (fire-and-forget, catches LLM bots that don't run JS)
      ctx.waitUntil(trackAnalytics(request, url));

      // Return modified HTML with optimized caching
      const headers = new Headers(originResponse.headers);
      // Cache for 1 hour, serve stale for 24h with background refresh (configurable to your liking)
      // Worker always runs for analytics even when serving cached content
      headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      headers.set('Content-Length', html.length.toString()); // Update after HTML modification

      return new Response(html, {
        status: originResponse.status,
        headers: headers
      });

    } catch (error) {
      console.error('LunaLift integration error:', error);
      // On error, pass through to origin
      return fetch(request);
    }
  }
};

/**
 * Track analytics via LunaLift bot-check endpoint (headers-only format).
 * Captures LLM bots that don't execute JavaScript.
 */
async function trackAnalytics(request, url) {
  try {
    await fetch('https://optimize.lunalift.ai/bot-check', {
      method: 'POST',
      headers: {
        'X-Page-URL': url.href,  // Full URL (domain + path + query)
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
        'X-Original-User-Agent': request.headers.get('User-Agent') || '',
        'X-Original-Referer': request.headers.get('Referer') || ''
      }
      // No body - everything auto-detected from X-Page-URL
    });
  } catch (error) {
    // Silent failure - analytics should never break the site
    console.error('Analytics tracking failed:', error);
  }
}
