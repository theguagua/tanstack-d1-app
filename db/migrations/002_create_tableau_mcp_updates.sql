-- Tableau MCP daily updates table
CREATE TABLE IF NOT EXISTS tableau_mcp_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commit_date DATE NOT NULL,
  commit_sha TEXT NOT NULL UNIQUE,
  pr_number TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  author TEXT NOT NULL,
  files_changed INTEGER,
  additions INTEGER,
  deletions INTEGER,
  commit_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_tableau_mcp_updates_date ON tableau_mcp_updates(commit_date DESC);

-- Index for PR-based queries
CREATE INDEX IF NOT EXISTS idx_tableau_mcp_updates_pr ON tableau_mcp_updates(pr_number);