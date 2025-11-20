# LunaLift Integration - SvelteKit

Alternative to Cloudflare Workers for SvelteKit applications using server hooks.

## Features

✅ Works with any SvelteKit adapter
✅ Serves llms.txt and .md files from LunaLift CDN
✅ Injects schema.json into HTML pages (client-side or server-side)
✅ Tracks analytics for LLM bot detection
✅ Injects tracking pixel for AI Overview events
✅ Deployed to any SvelteKit host (Vercel, Netlify, Cloudflare Pages, self-hosted)

## Installation

### Basic Setup (Client-Side Schema Injection)

1. **Copy the hooks file**
   ```bash
   # Copy hooks.server.ts to your SvelteKit project
   cp hooks.server.ts /path/to/your/sveltekit-app/src/
   ```

2. **Deploy your SvelteKit app**
   ```bash
   npm run build
   npm run preview

   # Or deploy to Vercel, Netlify, etc.
   ```

3. **Done!** Your site is now LunaLift-enabled.

### Advanced Setup (Server-Side Schema Injection)

For better SEO, inject the schema server-side:

1. **Copy all three files**
   ```bash
   cp hooks.server.ts /path/to/your/sveltekit-app/src/
   cp +layout.server.ts /path/to/your/sveltekit-app/src/routes/
   cp +layout.svelte /path/to/your/sveltekit-app/src/routes/
   ```

2. **If you have an existing layout**, merge the code:
   - In `+layout.server.ts`: Add the `lunaLiftSchema` fetch logic
   - In `+layout.svelte`: Add the schema injection block in `<svelte:head>`

3. **Remove client-side schema injection** from `hooks.server.ts`:
   ```typescript
   // Delete the schemaScript injection code
   // Keep only the tracking pixel injection
   ```

## How It Works

The hooks intercept all requests and:

1. **Derives subdomain** from request domain:
   - `www.acme.com` → `acme-com.lunalift.ai`
   - `shop.acme.com` → `shop-acme-com.lunalift.ai`

2. **Serves AI-optimized content**:
   - `GET /llms.txt` → Proxies to `acme-com.lunalift.ai/llms.txt`
   - `GET /about.md` → Proxies to `acme-com.lunalift.ai/about.md`

3. **Injects structured data**:
   - Fetches schema.json from LunaLift CDN
   - Injects into `<head>` as ld+json (client-side or server-side)

4. **Tracks analytics**:
   - Fire-and-forget requests to LunaLift bot-check endpoint
   - Captures LLM bot visits and browser events

## Configuration

### Excluding Your Own .md Files

If you have markdown files that shouldn't be served from LunaLift:

```typescript
// In hooks.server.ts
if (path === '/llms.txt' || (path.endsWith('.md') && path !== '/my-docs.md')) {
  // LunaLift CDN logic
}
```

### Custom Adapters

This integration works with all SvelteKit adapters:

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';      // Vercel
// import adapter from '@sveltejs/adapter-netlify';  // Netlify
// import adapter from '@sveltejs/adapter-cloudflare'; // Cloudflare Pages
// import adapter from '@sveltejs/adapter-node';     // Node.js

export default {
  kit: {
    adapter: adapter()
  }
};
```

## Performance

- **First request**: ~10-20ms overhead (schema fetch + injection)
- **Cached requests**: ~1-5ms overhead
- **Analytics**: 0ms (fire-and-forget, non-blocking)
- **Server-side schema**: Faster initial render, better SEO

## Deployment Platforms

This integration works on:

- **Vercel** (adapter-vercel)
- **Netlify** (adapter-netlify)
- **Cloudflare Pages** (adapter-cloudflare)
- **Self-hosted** (adapter-node)
- **Any SvelteKit-compatible host**

## Multi-Domain Support

The hooks automatically handle multiple domains:

```
www.acme.com     → acme-com.lunalift.ai
shop.acme.com    → shop-acme-com.lunalift.ai
blog.acme.com    → blog-acme-com.lunalift.ai
```

Each domain gets its own LunaLift subdomain with separate content and analytics.

## Client-Side vs Server-Side Schema Injection

| Approach | Pros | Cons |
|----------|------|------|
| **Client-Side** | Simpler setup, works in hooks | Slower initial render, worse SEO |
| **Server-Side** | Faster render, better SEO | Requires layout files, more setup |

**Recommendation**: Use server-side injection for better SEO and performance.

## Troubleshooting

### Hooks not running

**Check hooks.server.ts location:**
- Must be in `src/hooks.server.ts`
- Restart dev server after changes

### Content not loading from LunaLift

**Verify LunaLift setup:**
- Log in to LunaLift dashboard
- Check that your domain is added
- Ensure content has been crawled

**Check logs:**
```bash
# Local dev
npm run dev
# Check terminal output

# Production logs (depends on adapter)
# Vercel: vercel logs
# Netlify: netlify logs
```

### Schema not injecting

**Client-side approach:**
- Check browser console for errors
- Verify schema.json URL in Network tab

**Server-side approach:**
- Check server logs for fetch errors
- Verify `+layout.server.ts` is in `src/routes/`
- Ensure `+layout.svelte` receives `data` prop

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
# Start SvelteKit dev server
npm run dev

# Test llms.txt
curl http://localhost:5173/llms.txt

# Test with custom host header
curl http://localhost:5173/llms.txt -H "Host: www.example.com"
```

## Comparison with Cloudflare Worker

| Feature | SvelteKit Hooks | Cloudflare Worker |
|---------|----------------|-------------------|
| **Setup** | Copy hooks file | Deploy worker + configure routes |
| **Hosting** | Any SvelteKit host | Cloudflare only |
| **Latency** | ~5-10ms | ~1ms (edge) |
| **Framework** | SvelteKit only | Framework-agnostic |
| **DNS** | Any provider | Cloudflare preferred |
| **Schema Injection** | Client or server-side | Server-side |

Use SvelteKit hooks if you're already using SvelteKit and want tight framework integration.

## Support

- [LunaLift Documentation](https://lunalift.ai/docs)
- [GitHub Issues](https://github.com/lunalift/cloudflare-worker-template/issues)
- [Contact Support](mailto:support@lunalift.ai)

## License

MIT License
