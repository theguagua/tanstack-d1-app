import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/image/$key')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async ({ params, context }) => {
          try {
            const r2 = globalThis.R2_BUCKET as R2Bucket | undefined;
            
            if (!r2) return new Response('R2 unavailable', { status: 500 });
            
            const object = await r2.get(params.key);
            
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