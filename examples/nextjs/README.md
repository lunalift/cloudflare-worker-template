# LunaLift Integration - Next.js

Alternative to Cloudflare Workers for Next.js applications using Next.js middleware.

## Features

✅ Works with both App Router and Pages Router
✅ Serves llms.txt and .md files from LunaLift CDN
✅ Injects schema.json into HTML pages
✅ Tracks analytics for LLM bot detection
✅ Injects tracking pixel for AI Overview events
✅ Deployed to any Next.js host (Vercel, Netlify, self-hosted)

## Installation

1. **Copy the middleware file**
   ```bash
   # Copy middleware.ts to your Next.js project root
   cp middleware.ts /path/to/your/nextjs-app/
   ```

2. **Deploy your Next.js app**
   ```bash
   # Vercel
   vercel deploy

   # Or Netlify, self-hosted, etc.
   ```

3. **Done!** Your site is now LunaLift-enabled.

## How It Works

The middleware intercepts all requests and:

1. **Derives subdomain** from request domain:
   - `www.acme.com` → `acme-com.lunalift.ai`
   - `shop.acme.com` → `shop-acme-com.lunalift.ai`

2. **Serves AI-optimized content**:
   - `GET /llms.txt` → Proxies to `acme-com.lunalift.ai/llms.txt`
   - `GET /about.md` → Proxies to `acme-com.lunalift.ai/about.md`

3. **Injects structured data**:
   - Fetches schema.json from LunaLift CDN
   - Injects into `<head>` as ld+json

4. **Tracks analytics**:
   - Fire-and-forget requests to LunaLift bot-check endpoint
   - Captures LLM bot visits and browser events

## Configuration

### Excluding Your Own .md Files

If you have markdown files that shouldn't be served from LunaLift:

```typescript
// In middleware.ts
if (path === '/llms.txt' || (path.endsWith('.md') && path !== '/my-docs.md')) {
  // LunaLift CDN logic
}
```

### Custom Matcher

By default, the middleware runs on all routes except static assets. Customize the matcher:

```typescript
export const config = {
  matcher: [
    '/blog/:path*',      // Only run on /blog routes
    '/docs/:path*',      // And /docs routes
    '/llms.txt',         // Always handle llms.txt
    '/(.*)\\.md$',       // And .md files
  ],
};
```

## Performance

- **First request**: ~10-20ms overhead (schema fetch + injection)
- **Cached requests**: ~1-5ms overhead
- **Analytics**: 0ms (fire-and-forget, non-blocking)

Middleware runs on every request but is highly optimized.

## Deployment Platforms

This middleware works on:

- **Vercel** (Edge Runtime)
- **Netlify** (Edge Functions)
- **Self-hosted** (Node.js)
- **Any Next.js-compatible host**

## Multi-Domain Support

The middleware automatically handles multiple domains:

```
www.acme.com     → acme-com.lunalift.ai
shop.acme.com    → shop-acme-com.lunalift.ai
blog.acme.com    → blog-acme-com.lunalift.ai
```

Each domain gets its own LunaLift subdomain with separate content and analytics.

## Troubleshooting

### Middleware not running

**Check matcher configuration:**
- Ensure your routes are included in the `matcher` pattern
- Verify middleware.ts is in project root

### Content not loading from LunaLift

**Verify LunaLift setup:**
- Log in to LunaLift dashboard
- Check that your domain is added
- Ensure content has been crawled

**Check logs:**
```bash
# Vercel
vercel logs

# Local dev
npm run dev
# Check terminal output
```

### 404 on llms.txt

**Common causes:**
1. Website not yet crawled in LunaLift
2. Subdomain mismatch (check logs)
3. Content not published to CDN

**Solution:**
- Trigger enrichment workflow in LunaLift dashboard
- Wait 5-10 minutes for completion

## Local Development

```bash
# Start Next.js dev server
npm run dev

# Test llms.txt
curl http://localhost:3000/llms.txt

# Test with custom host header
curl http://localhost:3000/llms.txt -H "Host: www.example.com"
```

## Comparison with Cloudflare Worker

| Feature | Next.js Middleware | Cloudflare Worker |
|---------|-------------------|-------------------|
| **Setup** | Copy 1 file | Deploy worker + configure routes |
| **Hosting** | Any Next.js host | Cloudflare only |
| **Latency** | ~5-10ms | ~1ms (edge) |
| **Framework** | Next.js only | Framework-agnostic |
| **DNS** | Any provider | Cloudflare preferred |

Use Next.js middleware if you're already using Next.js and want tight framework integration.

## Support

- [LunaLift Documentation](https://lunalift.ai/docs)
- [GitHub Issues](https://github.com/lunalift/cloudflare-worker-template/issues)
- [Contact Support](mailto:support@lunalift.ai)

## License

MIT License
