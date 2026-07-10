import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        POST: async ({ request, context }) => {
          try {
            const r2 = globalThis.R2_BUCKET as R2Bucket | undefined;
            
            if (!r2) return Response.json({ error: 'R2 unavailable' }, { status: 500 });
            
            const form = await request.formData();
            const file = form.get('file') as File | null;
            
            if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
            
            if (!file.type.startsWith('image/')) {
              return Response.json({ error: 'Only image files allowed' }, { status: 400 });
            }
            
            const ext = file.type.split('/')[1] || 'jpg';
            const key = `${crypto.randomUUID()}.${ext}`;
            
            const arrayBuffer = await file.arrayBuffer();
            await r2.put(key, arrayBuffer, {
              httpMetadata: {
                contentType: file.type,
              },
            });
            
            const imageUrl = `${new URL(request.url).origin}/api/image/${key}`;
            
            return Response.json({ success: true, url: imageUrl, key });
          } catch (e: any) {
            return Response.json({ error: e.message }, { status: 500 });
          }
        },
      }),
  },
});