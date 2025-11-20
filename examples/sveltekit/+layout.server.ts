/**
 * LunaLift Integration - SvelteKit Layout (Server-Side Schema Injection)
 *
 * Optional: Use this in combination with hooks.server.ts for server-side schema injection.
 * This provides better SEO as the schema is rendered server-side.
 *
 * Setup:
 * 1. Copy this to `src/routes/+layout.server.ts`
 * 2. Use the schema data in your `+layout.svelte` component
 */

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, request }) => {
  // Auto-generate subdomain from request domain
  const customerDomain = request.headers.get('host') || '';
  const subdomain = customerDomain.replace('www.', '').replace(/\./g, '-');
  const LUNALIFT_CDN = `https://${subdomain}.lunalift.ai`;

  // Fetch schema.json from LunaLift CDN
  const path = url.pathname;
  const schemaPath = path === '/' ? '/.schema.json' : `${path.replace(/\/$/, '')}.schema.json`;

  try {
    const response = await fetch(`${LUNALIFT_CDN}${schemaPath}`);
    if (response.ok) {
      const schema = await response.json();
      return { lunaLiftSchema: schema };
    }
  } catch (error) {
    console.error('Failed to fetch LunaLift schema:', error);
  }

  return { lunaLiftSchema: null };
};
