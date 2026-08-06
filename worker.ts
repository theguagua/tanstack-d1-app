/// <reference types="@cloudflare/workers-types" />
import { mainSync } from './src/sync';
import handler from './dist/server/server.js';

export default {
  async fetch(request, env) {
    globalThis.DB = env.DB;
    globalThis.R2_BUCKET = env.R2_BUCKET;
    
    const url = new URL(request.url);
    
    // API endpoint to manually trigger sync (for testing)
    if (url.pathname === '/api/sync') {
      await mainSync(env);
      return new Response(JSON.stringify({ success: true, message: 'Sync triggered' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // API endpoint to get latest updates
    if (url.pathname === '/api/updates') {
      const since = url.searchParams.get('since');
      const limit = Number(url.searchParams.get('limit') || 10);
      
      let sql = 'SELECT * FROM tableau_mcp_updates';
      const params: any[] = [];
      
      if (since) {
        sql += ' WHERE commit_date >= ?';
        params.push(since);
      }
      
      sql += ' ORDER BY commit_date DESC LIMIT ?';
      params.push(limit);
      
      const result = await DB.prepare(sql).bind(...params).all();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // API endpoint to get summary stats
    if (url.pathname === '/api/stats') {
      const result = await DB.prepare(`
        SELECT 
          COUNT(*) as total_commits,
          commit_date,
          COUNT(*) as daily_commits
        FROM tableau_mcp_updates
        GROUP BY commit_date
        ORDER BY commit_date DESC
        LIMIT 30
      `).all();
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For any other request, delegate to the TanStack Start app
    return handler.fetch(request);
  },
  async scheduled(controller, env) {
    console.log('🚀 开始执行定时任务同步...');
    try {
      await mainSync(env);
      console.log('✅ 同步完成！');
    } catch (error) {
      console.error('💥 同步失败:', error);
    }
  }
} satisfies ExportedHandler;