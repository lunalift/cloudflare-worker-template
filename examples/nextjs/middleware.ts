/**
 * LunaLift Integration - Next.js Middleware
 *
 * Alternative to Cloudflare Workers for Next.js applications.
 *
 * Setup:
 * 1. Copy this file to your Next.js project root as `middleware.ts`
 * 2. Deploy your Next.js app (Vercel, Netlify, etc.)
 * 3. Done!
 *
 * Works with both App Router and Pages Router.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extensions to ignore for analytics tracking (using Set for O(1) lookup)
const IGNORED_EXTENSIONS = new Set([
  '.js', '.css', '.xml', '.png', '.jpg', '.jpeg', '.gif', '.pdf',
  '.doc', '.ico', '.rss', '.zip', '.mp3', '.rar', '.exe', '.wmv',
  '.avi', '.ppt', '.mpg', '.mpeg', '.tif', '.wav', '.mov', '.psd',
  '.ai', '.xls', '.mp4', '.m4a', '.swf', '.dat', '.dmg', '.iso',
  '.flv', '.m4v', '.torrent', '.woff', '.woff2', '.ttf', '.svg',
  '.webmanifest', '.webp', '.avif'
]);

/**
 * Check if a request should be tracked in analytics
 */
function shouldTrackAnalytics(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();

  // Check file extension
  const ext = pathname.substring(pathname.lastIndexOf('.')).toLowerCase();
  if (ext && IGNORED_EXTENSIONS.has(ext)) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Auto-generate subdomain from request domain
  const customerDomain = request.headers.get('host') || '';
  const subdomain = customerDomain.replace('www.', '').replace(/\./g, '-');
  const LUNALIFT_CDN = `https://${subdomain}.lunalift.ai`;

  try {
    // 1. Serve llms.txt and .md files from LunaLift CDN
    if (path === '/llms.txt' || path.endsWith('.md')) {
      const cdnHeaders = new Headers();
      cdnHeaders.set('X-Page-URL', url.href);
      cdnHeaders.set('X-Forwarded-For', request.ip || '');
      cdnHeaders.set('X-Original-User-Agent', request.headers.get('user-agent') || '');
      cdnHeaders.set('X-Original-Referer', request.headers.get('referer') || '');

      const cdnResponse = await fetch(`${LUNALIFT_CDN}${path}`, {
        headers: cdnHeaders
      });

      return new NextResponse(cdnResponse.body, {
        status: cdnResponse.status,
        headers: cdnResponse.headers
      });
    }

    // 2. For HTML pages: inject schema.json + tracking pixel
    const response = NextResponse.next();

    // Track analytics (fire-and-forget)
    // Skip tracking for static assets
    if (shouldTrackAnalytics(url)) {
      trackAnalytics(request, url);
    }

    // Let Next.js handle the response, we'll transform it
    const htmlResponse = await fetch(request.url, {
      headers: request.headers
    });

    const contentType = htmlResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return htmlResponse;
    }

    let html = await htmlResponse.text();

    // Fetch and inject schema.json
    const schemaPath = path === '/' ? '/.schema.json' : `${path.replace(/\/$/, '')}.schema.json`;
    const schemaResponse = await fetch(`${LUNALIFT_CDN}${schemaPath}`);

    if (schemaResponse.ok) {
      const schema = await schemaResponse.json();
      const schemaTag = `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`;

      // Remove existing ld+json scripts
      html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

      // Inject LunaLift schema
      html = html.replace('</head>', `${schemaTag}\n</head>`);
    }

    // Inject tracking pixel
    if (!html.includes('optimize.lunalift.ai/pixel.js')) {
      const pixelTag = '  <script src="https://optimize.lunalift.ai/pixel.js"></script>';
      html = html.replace('</body>', `${pixelTag}\n</body>`);
    }

    return new NextResponse(html, {
      status: htmlResponse.status,
      headers: htmlResponse.headers
    });

  } catch (error) {
    console.error('LunaLift integration error:', error);
    return NextResponse.next();
  }
}

/**
 * Track analytics via LunaLift bot-check endpoint.
 */
async function trackAnalytics(request: NextRequest, url: URL) {
  try {
    await fetch('https://optimize.lunalift.ai/bot-check', {
      method: 'POST',
      headers: {
        'X-Page-URL': url.href,
        'X-Forwarded-For': request.ip || '',
        'X-Original-User-Agent': request.headers.get('user-agent') || '',
        'X-Original-Referer': request.headers.get('referer') || ''
      }
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
