/**
 * LunaLift Integration - SvelteKit Hooks
 *
 * Alternative to Cloudflare Workers for SvelteKit applications.
 *
 * Setup:
 * 1. Copy this code into your `src/hooks.server.ts` file
 * 2. Deploy your SvelteKit app (Vercel, Netlify, Cloudflare Pages, etc.)
 * 3. Done!
 *
 * Works with any SvelteKit adapter.
 */

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Auto-generate subdomain from request domain
  const customerDomain = event.request.headers.get('host') || '';
  const subdomain = customerDomain.replace('www.', '').replace(/\./g, '-');
  const LUNALIFT_CDN = `https://${subdomain}.lunalift.ai`;

  try {
    // 1. Serve llms.txt and .md files from LunaLift CDN
    if (path === '/llms.txt' || path.endsWith('.md')) {
      const cdnHeaders = new Headers();
      cdnHeaders.set('X-Page-URL', url.href);
      cdnHeaders.set('X-Forwarded-For', event.getClientAddress());
      cdnHeaders.set('X-Original-User-Agent', event.request.headers.get('user-agent') || '');
      cdnHeaders.set('X-Original-Referer', event.request.headers.get('referer') || '');

      const cdnResponse = await fetch(`${LUNALIFT_CDN}${path}`, {
        headers: cdnHeaders
      });

      return new Response(cdnResponse.body, {
        status: cdnResponse.status,
        headers: cdnResponse.headers
      });
    }

    // 2. For HTML pages: inject schema.json + tracking pixel
    const response = await resolve(event, {
      transformPageChunk: ({ html }) => {
        return transformHTML(html, LUNALIFT_CDN, path);
      }
    });

    // Track analytics (fire-and-forget)
    trackAnalytics(event, url);

    return response;

  } catch (error) {
    console.error('LunaLift integration error:', error);
    return resolve(event);
  }
};

/**
 * Transform HTML to inject schema.json and tracking pixel.
 */
function transformHTML(html: string, LUNALIFT_CDN: string, path: string): string {
  // This function runs synchronously, so we can't fetch schema here
  // Instead, we'll inject a script that fetches and injects the schema client-side
  // For server-side injection, use the +layout.server.ts approach below

  // Inject tracking pixel
  if (!html.includes('optimize.lunalift.ai/pixel.js')) {
    const pixelTag = '  <script src="https://optimize.lunalift.ai/pixel.js"></script>';
    html = html.replace('</body>', `${pixelTag}\n</body>`);
  }

  // Inject schema fetcher script
  const schemaPath = path === '/' ? '/.schema.json' : `${path.replace(/\/$/, '')}.schema.json`;
  const schemaScript = `
  <script>
    (async () => {
      try {
        const response = await fetch('${LUNALIFT_CDN}${schemaPath}');
        if (response.ok) {
          const schema = await response.json();
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify(schema);
          document.head.appendChild(script);
        }
      } catch (e) {
        console.error('Failed to load LunaLift schema:', e);
      }
    })();
  </script>`;

  html = html.replace('</head>', `${schemaScript}\n</head>`);

  return html;
}

/**
 * Track analytics via LunaLift bot-check endpoint.
 */
function trackAnalytics(event: any, url: URL) {
  // Fire-and-forget (don't await)
  fetch('https://optimize.lunalift.ai/bot-check', {
    method: 'POST',
    headers: {
      'X-Page-URL': url.href,
      'X-Forwarded-For': event.getClientAddress(),
      'X-Original-User-Agent': event.request.headers.get('user-agent') || '',
      'X-Original-Referer': event.request.headers.get('referer') || ''
    }
  }).catch(error => {
    console.error('Analytics tracking failed:', error);
  });
}
