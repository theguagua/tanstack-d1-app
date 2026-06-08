import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/image/$key')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async ({ params }) => {
          try {
            // @ts-ignore - R2 binding injected by worker.ts
            const r2 = globalThis.R2_BUCKET as R2Bucket | undefined;
            
            if (!r2) return new Response('R2 bucket unavailable', { status: 500 });
            
            const key = decodeURIComponent(params.key);
            const object = await r2.get(key);
            
            if (!object) return new Response('Not found', { status: 404 });
            
            return new Response(object.body, {
              headers: {
                'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          } catch (e: any) {
            return new Response(e.message, { status: 500 });
          }
        },
      }),
  },
});