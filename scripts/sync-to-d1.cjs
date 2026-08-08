"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const D1_DATABASE_NAME = 'tanstack-d1-database';
const UPDATES_FILE = path.join(__dirname, '..', 'data', 'updates.json');

// 读取 updates.json
function loadUpdates() {
  const content = fs.readFileSync(UPDATES_FILE, 'utf8');
  return JSON.parse(content);
}

// 执行 D1 SQL 命令
// 优先用本地安装的 wrangler（npm ci / npm install 后存在于 node_modules/.bin），
// 否则退回全局 PATH 里的 wrangler —— 兼容 GitHub Actions 与本地环境。
const WRANGLER_BIN = require('fs').existsSync(path.join(__dirname, '..', 'node_modules', '.bin', 'wrangler'))
  ? path.join(__dirname, '..', 'node_modules', '.bin', 'wrangler')
  : 'wrangler';
function execD1(sql, params = []) {
  const paramStr = params.length > 0 ? `--args ${params.map(p => JSON.stringify(p)).join(' ')}` : '';
  const cmd = `${WRANGLER_BIN} d1 execute ${D1_DATABASE_NAME} --command "${sql}" ${paramStr} --json`;
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(output);
  } catch (err) {
    console.error(`❌ D1 执行失败: ${cmd}`);
    console.error(err.stdout?.toString() || err.message);
    throw err;
  }
}

// 创建表（如果不存在）
async function createTable() {
  const sql = `
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
  `;
  
  console.log('📋 创建表结构...');
  execD1(sql);
  console.log('✅ 表结构就绪');
}

// 清空旧数据
async function clearData() {
  console.log('🗑️  清空旧数据...');
  execD1('DELETE FROM tableau_mcp_updates');
  console.log('✅ 已清空');
}

// 批量插入数据
async function insertData(updates) {
  console.log('📥 开始插入数据...');
  let count = 0;
  for (const [date, dayUpdate] of Object.entries(updates.updates)) {
    for (const commit of dayUpdate.commits) {
      const sql = `INSERT OR REPLACE INTO tableau_mcp_updates 
        (commit_sha, commit_date, pr_number, title, summary, author, files_changed, additions, deletions, commit_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
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
      ];
      
      execD1(sql, params);
      count++;
    }
  }
  console.log(`✅ 成功插入 ${count} 条提交记录`);
}

// 验证数据
async function verifyData() {
  console.log('🔍 验证数据...');
  const result = execD1('SELECT COUNT(*) as total FROM tableau_mcp_updates');
  console.log(`📊 数据库中共有 ${result[0]?.results[0]?.total || 0} 条记录`);
  
  // 显示最新 5 条
  const latest = execD1('SELECT commit_date, pr_number, title FROM tableau_mcp_updates ORDER BY commit_date DESC LIMIT 5');
  console.log('\n📋 最新 5 条记录:');
  latest[0]?.results?.forEach((row, i) => {
    console.log(`  ${i + 1}. [${row.commit_date}] ${row.pr_number ? '#' + row.pr_number : 'commit'} - ${row.title}`);
  });
}

// 主函数
async function main() {
  console.log('🚀 开始同步 Tableau MCP 更新到 D1 数据库\n');
  
  try {
    const updates = loadUpdates();
    console.log(`📄 读取到 ${Object.keys(updates.updates).length} 天的更新数据`);
    console.log(`📅 同步范围: ${updates.meta.monitoring_since} ~ ${updates.meta.last_sync}`);
    console.log(`📝 总提交数: ${updates.meta.total_commits}\n`);
    
    await createTable();
    await clearData();
    await insertData(updates);
    await verifyData();
    
    console.log('\n🎉 同步完成！');
  } catch (err) {
    console.error('\n💥 同步失败:', err.message);
    process.exit(1);
  }
}

main();