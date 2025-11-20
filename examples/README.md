# Framework Integration Examples

These examples show **alternative approaches** for integrating LunaLift **without using Cloudflare Workers**.

## When to Use These Examples

Use these alternatives if:
- Your domain is NOT on Cloudflare
- You cannot use Cloudflare Workers
- You prefer framework-native middleware/hooks
- You want tighter integration with your existing framework

## When to Use the Cloudflare Worker

Use the main Cloudflare Worker template if:
- Your domain is on Cloudflare (or you're willing to migrate)
- You want zero-configuration setup
- You want edge-level performance
- You want framework-agnostic integration

## Available Examples

### [Next.js](./nextjs/)
- Uses Next.js middleware for proxying and injection
- Works with both App Router and Pages Router
- Deployed to Vercel, Netlify, or any Node.js host

### [SvelteKit](./sveltekit/)
- Uses SvelteKit hooks (`hooks.server.ts`)
- Works with any SvelteKit adapter
- Deployed to Vercel, Netlify, Cloudflare Pages, or any Node.js host

## Common Pattern

All examples follow the same integration pattern:

1. **Auto-generate subdomain** from request domain:
   ```javascript
   const domain = request.headers.get('host');
   const subdomain = domain.replace('www.', '').replace(/\./g, '-');
   const LUNALIFT_CDN = `https://${subdomain}.lunalift.ai`;
   ```

2. **Serve llms.txt and .md files** from LunaLift CDN with analytics headers

3. **Inject schema.json** into HTML `<head>` as ld+json

4. **Inject tracking pixel** at end of `<body>`

5. **Track analytics** via LunaLift bot-check endpoint (fire-and-forget)

## Requirements

All examples require:
- LunaLift subscription
- Your website set up in LunaLift dashboard
- Content crawled and published to CDN

## Performance

Framework middleware typically adds:
- **~10-20ms** for first request (schema fetch + injection)
- **~1-5ms** for cached requests
- **0ms** for analytics (fire-and-forget)

This is slightly slower than Cloudflare Workers (~1ms edge processing) but still imperceptible to users.

## Choosing the Right Approach

| Approach | Best For | Latency | Setup Complexity |
|----------|----------|---------|------------------|
| **Cloudflare Worker** | Domains on Cloudflare | ~1ms | Lowest (zero-config) |
| **Next.js Middleware** | Next.js apps | ~5-10ms | Low |
| **SvelteKit Hooks** | SvelteKit apps | ~5-10ms | Low |

## Support

For questions about these examples:
- [LunaLift Documentation](https://lunalift.ai/docs)
- [GitHub Issues](https://github.com/lunalift/cloudflare-worker-template/issues)
- [Contact Support](mailto:support@lunalift.ai)
