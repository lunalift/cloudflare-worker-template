<script lang="ts">
  /**
   * LunaLift Integration - SvelteKit Layout Component
   *
   * Optional: Use this in combination with +layout.server.ts for server-side schema injection.
   *
   * Setup:
   * 1. Copy this to `src/routes/+layout.svelte` (or merge with existing layout)
   * 2. The schema will be injected server-side for better SEO
   */

  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<svelte:head>
  {#if data.lunaLiftSchema}
    {@html `<script type="application/ld+json">${JSON.stringify(data.lunaLiftSchema)}</script>`}
  {/if}
</svelte:head>

<slot />
