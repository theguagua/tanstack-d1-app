/**
 * Cloudflare-specific types
 * These make TypeScript aware of Cloudflare Workers bindings at runtime
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
    }
  }
}

declare global {
  // @ts-ignore - Cloudflare Workers D1 binding
  var DB: D1Database;
}

export {};