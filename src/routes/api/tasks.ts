import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async () => {
          try {
            // @ts-ignore - D1 binding injected by worker.ts
            const db = globalThis.DB as D1Database | undefined;
            
            if (!db) {
              return Response.json({ 
                tasks: [], 
                error: 'DB unavailable'
              }, { status: 500 });
            }
            
            const tasks = await db.prepare(
              `SELECT id, user_id, title, description, due_date, image_url, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC`
            ).bind(1).all();
            
            return Response.json({ tasks: tasks.results || [] });
          } catch (e: any) {
            return Response.json({ tasks: [], error: e.message }, { status: 500 });
          }
        },
        POST: async ({ request }) => {
          try {
            // @ts-ignore - D1 binding injected by worker.ts
            const db = globalThis.DB as D1Database | undefined;
            
            if (!db) return Response.json({ error: 'DB unavailable' }, { status: 500 });
            
            const form = await request.formData();
            const title = form.get('title') as string;
            const description = form.get('description') as string;
            const image_url = form.get('image_url') as string;
            
            if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
            
            const result = await db.prepare(
              `INSERT INTO tasks (user_id, title, description, image_url) VALUES (?, ?, ?, ?)`
            ).bind(1, title, description || null, image_url || null).run();
            
            return Response.json({ success: true, id: result.meta.last_row_id });
          } catch (e: any) {
            return Response.json({ error: e.message }, { status: 500 });
          }
        },
        PUT: async ({ request }) => {
          try {
            // @ts-ignore - D1 binding injected by worker.ts
            const db = globalThis.DB as D1Database | undefined;
            
            if (!db) return Response.json({ error: 'DB unavailable' }, { status: 500 });
            
            const body = await request.json();
            const { id, title, description, completed, due_date, image_url } = body;
            
            if (!id) return Response.json({ error: 'Task ID required' }, { status: 400 });
            
            const updates: string[] = [];
            const values: any[] = [];
            
            if (title !== undefined) { updates.push('title = ?'); values.push(title); }
            if (description !== undefined) { updates.push('description = ?'); values.push(description); }
            if (completed !== undefined) { updates.push('completed = ?'); values.push(completed ? 1 : 0); }
            if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
            if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
            
            if (updates.length === 0) {
              return Response.json({ error: 'No fields to update' }, { status: 400 });
            }
            
            // Bind: values for updates, then id and user_id for WHERE clause
            const result = await db.prepare(
              `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`
            ).bind(...values, id, 1).run();
            
            if (result.meta.changes === 0) {
              return Response.json({ error: 'Task not found' }, { status: 404 });
            }
            
            return Response.json({ success: true });
          } catch (e: any) {
            return Response.json({ error: e.message }, { status: 500 });
          }
        },
        DELETE: async ({ request }) => {
          try {
            // @ts-ignore - D1 binding injected by worker.ts
            const db = globalThis.DB as D1Database | undefined;
            
            if (!db) return Response.json({ error: 'DB unavailable' }, { status: 500 });
            
            const body = await request.json();
            const { id } = body;
            
            if (!id) return Response.json({ error: 'Task ID required' }, { status: 400 });
            
            const result = await db.prepare(
              `DELETE FROM tasks WHERE id = ? AND user_id = ?`
            ).bind(id, 1).run();
            
            if (result.meta.changes === 0) {
              return Response.json({ error: 'Task not found' }, { status: 404 });
            }
            
            return Response.json({ success: true });
          } catch (e: any) {
            return Response.json({ error: e.message }, { status: 500 });
          }
        },
      }),
  },
});