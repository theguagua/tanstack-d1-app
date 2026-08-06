// src/sync.ts
// The scheduled sync logic + HTTP API for the updates.
//
// NOTE: This code runs inside a Cloudflare Worker, which has NO filesystem.
// So the updates data is bundled into the build via a plain JSON import
// below (esbuild/wrangler inlines it at build time), NOT read from disk.

import updatesJson from '../data/updates.json';

// Types for the data we get from updates.json
interface CommitItem {
  sha: string;
  pr: string | null;
  title: string;
  summary: string;
  author: string;
  files: number | null;
  additions: number | null;
  deletions: number | null;
}

interface DayUpdate {
  count: number;
  prs: (string | null)[];
  commits: CommitItem[];
}

interface UpdatesData {
  meta: {
    source: string;
    monitoring_since: string;
    last_sync: string;
    total_commits: number;
    generated_by: string;
  };
  updates: Record<string, DayUpdate>;
}

// D1 database binding (set by wrangler)
let DB: D1Database;

// Load updates data (bundled at build time via JSON import)
function loadUpdatesData(): UpdatesData {
  return updatesJson as UpdatesData;
}

// Initialize database tables if they don't exist
async function initDatabase() {
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS tableau_mcp_updates (
      commit_sha TEXT PRIMARY KEY,
      commit_date DATE NOT NULL,
      pr_number TEXT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      author TEXT NOT NULL,
      files_changed INTEGER,
      additions INTEGER,
      deletions INTEGER,
      commit_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tableau_mcp_updates_date 
    ON tableau_mcp_updates(commit_date DESC);

    CREATE INDEX IF NOT EXISTS idx_tableau_mcp_updates_pr 
    ON tableau_mcp_updates(pr_number);
  `).all();
  
  console.log('Database tables initialized');
}

// Populate database with updates data
async function populateDatabase() {
  const data = loadUpdatesData();
  
  // Clear existing data
  await DB.prepare('DELETE FROM tableau_mcp_updates').all();
  
  // Insert new data
  let count = 0;
  for (const [date, dayUpdate] of Object.entries(data.updates)) {
    for (const commit of dayUpdate.commits) {
      await DB.prepare(`
        INSERT INTO tableau_mcp_updates 
        (commit_sha, commit_date, pr_number, title, summary, author, files_changed, additions, deletions, commit_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        commit.sha,
        date,
        commit.pr ?? null,
        commit.title,
        commit.summary,
        commit.author,
        commit.files ?? 0,
        commit.additions ?? 0,
        commit.deletions ?? 0,
        `https://github.com/tableau/tableau-mcp/commit/${commit.sha}`
      ).all();
      
      count++;
    }
  }
  
  console.log(`Database populated with ${count} commits`);
}

// Main sync function
export async function mainSync(env: any) {
  try {
    DB = env.DB;
    await initDatabase();
    await populateDatabase();
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

export default {
  async scheduled(controller: ScheduledController, env: any, ctx: ExecutionContext) {
    DB = env.DB;
    await mainSync(env);
  },
  
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    DB = env.DB;
    
    const url = new URL(request.url);
    
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
    
    // API endpoint to manually trigger sync (for testing)
    if (url.pathname === '/api/sync') {
      await mainSync(env);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For any other request, delegate to the TanStack Start app
    try {
      const { default: handler } = await import('./dist/server/server.js');
      return handler.fetch(request);
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
};