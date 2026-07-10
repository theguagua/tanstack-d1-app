/// <reference types="@cloudflare/workers-types" />
import handler from './dist/server/server.js';

export default {
  fetch: (request, env) => {
    globalThis.DB = env.DB;
    globalThis.R2_BUCKET = env.R2_BUCKET;
    return handler.fetch(request);
  },
} satisfies ExportedHandler;