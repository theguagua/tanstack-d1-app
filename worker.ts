import { serveStatic } from '@cloudflare/kv-asset-handler';
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request, env, ctx) {
    // Inject D1 binding into globalThis for TanStack Start server handlers
    globalThis.DB = env.DB;
    
    try {
      return await handler(request);
    } catch (e) {
      return new Response(`Error: ${e}`, { status: 500 });
    }
  },
} satisfies ExportedHandler;