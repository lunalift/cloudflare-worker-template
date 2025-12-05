# LunaLift Cloudflare Worker Template

A Cloudflare Worker template for seamless LunaLift integration on your website. This worker automatically serves your LunaLift-optimized content (llms.txt, schemas, markdown) and tracks analytics for AI/LLM traffic.

## Features

✅ **Zero Configuration** - Automatically derives your LunaLift subdomain from your domain
✅ **llms.txt & Markdown** - Serves AI-optimized content from LunaLift CDN
✅ **Schema Injection** - Injects structured data into your HTML pages
✅ **Analytics Tracking** - Captures both bot traffic (server-side) and browser events (client-side)
✅ **Multi-Domain Support** - Works across www, subdomains, and multiple domains

## Quick Start

### Prerequisites

- Cloudflare account
- Domain on Cloudflare (nameservers pointing to Cloudflare) OR using Custom Domains
- LunaLift account with your website set up

### Installation

1. **Clone this template**
   ```bash
   npx wrangler init my-lunalift-worker --template https://github.com/lunalift/cloudflare-worker-template
   cd my-lunalift-worker
   ```

2. **Deploy the worker**
   ```bash
   npx wrangler deploy
   ```

3. **Add route to your domain**

   **IMPORTANT**: The route pattern must match your website's exact domain:
   - If your website is at `yourdomain.com` → use `yourdomain.com/*`
   - If your website is at `www.yourdomain.com` → use `www.yourdomain.com/*`
   - For all subdomains → use `*.yourdomain.com/*`

   **Option A: Via Cloudflare Dashboard**
   - Go to Workers & Pages > Your Worker > Settings > Triggers
   - Click "Add route"
   - Enter the pattern that matches your domain (see examples above)
   - Select your zone
   - Save

   **Option B: Via CLI**
   ```bash
   # If your main site is yourdomain.com (apex):
   npx wrangler routes create "yourdomain.com/*" --zone-name yourdomain.com

   # If your main site is www.yourdomain.com:
   npx wrangler routes create "www.yourdomain.com/*" --zone-name yourdomain.com

   # For all subdomains (www, blog, shop, etc.):
   npx wrangler routes create "*.yourdomain.com/*" --zone-name yourdomain.com
   ```

4. **Done!** Your site is now LunaLift-enabled.

## How It Works

The worker automatically:

1. **Derives your subdomain** from the request domain:
   - `www.acme.com` → `acme-com.lunalift.ai`
   - `shop.acme.com` → `shop-acme-com.lunalift.ai`

2. **Serves AI-optimized content**:
   - `GET /llms.txt` → Fetches from `acme-com.lunalift.ai/llms.txt`
   - `GET /about.md` → Fetches from `acme-com.lunalift.ai/about.md`

3. **Injects structured data**:
   - Fetches schema.json from LunaLift CDN
   - Injects into `<head>` as ld+json

4. **Tracks analytics**:
   - Server-side: Detects LLM bots that don't run JavaScript
   - Client-side: Injects tracking pixel for browser-based events

## DNS Requirements

### If Your Domain Is On Cloudflare

✅ Use routes (as shown above) - simplest option

### If Your Domain Uses Another DNS Provider

You have two options:

**Option 1: Transfer to Cloudflare** (recommended)
- Point your nameservers to Cloudflare
- Then use routes as normal

**Option 2: Use Custom Domains**
1. Deploy worker: `npx wrangler deploy`
2. Add Custom Domain in Cloudflare dashboard:
   - Workers & Pages > Your Worker > Settings > Domains & Routes
   - Add Custom Domain: `www.example.com`
3. Add CNAME record in your DNS provider:
   - `www.example.com` CNAME `your-worker.your-subdomain.workers.dev`

## Multi-Domain Websites

If your website spans multiple domains (e.g., `www.acme.com`, `shop.acme.com`, `blog.acme.com`), the worker handles them automatically:

- Each domain gets its own LunaLift subdomain
- Content is stored separately in R2
- Analytics are tracked per-domain
- All managed under one LunaLift account

Just add routes for all domains:
```bash
npx wrangler routes create "www.example.com/*" --zone-name example.com
npx wrangler routes create "shop.example.com/*" --zone-name example.com
npx wrangler routes create "blog.example.com/*" --zone-name example.com
```

## Customization

### Excluding Your Own .md Files

If you have markdown files that shouldn't be served from LunaLift, add exclusions:

```javascript
// In lunalift-cloudflare-worker.js
if (path === '/llms.txt' || (path.endsWith('.md') && path !== '/my-own-docs.md')) {
  // LunaLift CDN logic
}
```

### Adjusting Cache Settings

Modify the cache headers in the worker:

```javascript
// Default: 1 hour cache, 24h stale-while-revalidate
headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

// More aggressive caching:
headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
```

## Alternative Integrations (Non-Cloudflare)

**Can't use Cloudflare Workers?** Check out the [examples](./examples) directory for framework-specific alternatives:

- **[Next.js](./examples/nextjs/)** - Middleware-based integration
- **[SvelteKit](./examples/sveltekit/)** - Server hooks integration

These examples provide the same functionality using framework-native middleware/hooks instead of Cloudflare Workers. Use them if:
- Your domain is NOT on Cloudflare
- You prefer framework-native integration
- You want tighter control over the integration logic

**Note:** The Cloudflare Worker template (this directory) is the recommended approach for simplicity and performance if your domain is on Cloudflare.

## Troubleshooting

### Worker not triggering

**Check routes:**
```bash
npx wrangler routes list
```

**Verify zone:**
- Ensure your domain is added to Cloudflare
- Check that the zone name matches

### Content not loading from LunaLift

**Verify your website is set up in LunaLift:**
- Log in to your LunaLift account
- Check that your domain is added
- Ensure content has been crawled/enriched

**Check subdomain generation:**
- Worker logs: `npx wrangler tail`
- Look for the derived subdomain in logs

### 404 on llms.txt

**Common causes:**
1. Website not yet crawled in LunaLift
2. Subdomain mismatch (check worker logs)
3. Content not yet published to CDN

**Solution:**
- Log in to LunaLift dashboard
- Trigger website enrichment workflow
- Wait for completion (~5-10 minutes)

## Development

### Local Testing

```bash
# Start local dev server
npx wrangler dev

# Test with curl
curl http://localhost:8787/llms.txt -H "Host: www.example.com"
```

### View Logs

```bash
# Tail live logs
npx wrangler tail

# Filter by status
npx wrangler tail --status error
```

## What Gets Tracked

**Server-Side (All Requests):**
- LLM bot visits (ChatGPT, Claude, Gemini, Perplexity, etc.)
- Page path and query parameters
- Referrer domain
- User agent

**Client-Side (JavaScript Pixel):**
- AI Overview scroll-to-text fragments (`#:~:text=...`)
- Browser-based conversion events
- Visit counting and page journey

## Performance & Caching

**Caching Strategy:**
- HTML cached for 1 hour (fast edge delivery)
- Stale content served for 24 hours with background refresh
- Analytics tracked every request (even cache hits)

**Latency:**
- **Static files** (llms.txt, .md): ~5-10ms (pass-through to LunaLift CDN)
- **Schema injection**: ~10-20ms first request, ~0ms from cache
- **Analytics tracking**: 0ms (fire-and-forget, non-blocking)
- **Cached HTML**: ~1ms (served from Cloudflare edge)

Total overhead: **~10-20ms** first request, **~1ms** cached requests

## Support

- 📚 [LunaLift Documentation](https://lunalift.ai/docs)
- 💬 [GitHub Issues](https://github.com/lunalift/cloudflare-worker-template/issues)
- ✉️ [Contact Support](mailto:support@lunalift.ai)

## License

Free to use for LunaLift integrations - see [LICENSE](LICENSE) for details
