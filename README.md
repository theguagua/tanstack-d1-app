# 📊 Tableau MCP 每日更新监控面板

基于 **TanStack Start** + **Cloudflare D1/R2** 构建的实时监控平台，专门用于追踪和展示 [tableau/tableau-mcp](https://github.com/tableau/tableau-mcp) 仓库的每日提交动态。自动从 GitHub 抓取提交记录，存入 Cloudflare D1 数据库，并通过现代化的时间线 UI 进行可视化展示。

---

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| **自动化数据采集** | 每日 07:00 自动从 GitHub API 抓取 `tableau/tableau-mcp` 最新提交 |
| **智能增量同步** | 仅同步新增提交，避免重复写入，支持断点续传 |
| **D1 持久化存储** | 所有提交记录存入 Cloudflare D1 (`tableau_mcp_updates` 表)，支持 SQL 查询与历史回溯 |
| **时间线可视化** | 竖向导轨 + 每日节点圆点 + 卡片左贴的现代化时间线布局，支持暗色模式 |
| **PR/Commit 关联** | 自动解析 PR 编号、作者、文件变更统计（增/删行数），一键跳转 GitHub 原始提交 |
| **多端部署** | Cloudflare Workers + Pages 一键部署，全球边缘节点加速访问 |

---

## 🛠 技术栈

| 层级 | 技术选型 | 版本/备注 |
|------|----------|-----------|
| **前端框架** | TanStack Start (React SSR) | v1.x, 文件路由 + 服务端渲染 |
| **样式系统** | @cloudflare/kumo (Tailwind v4) | 组件库 + 原子化 CSS，暗色模式原生支持 |
| **数据库** | Cloudflare D1 (SQLite) | `tanstack-d1-database`，绑定名 `DB` |
| **对象存储** | Cloudflare R2 | `tanstack-task-images`（预留，用于未来图片/导出功能） |
| **构建工具** | Vite + TypeScript | `tsr generate && vite build` 生成 Router Manifest |
| **部署平台** | Cloudflare Workers / Pages | Git 集成自动部署，Cron Trigger 定时同步 |
| **同步脚本** | Node.js + wrangler CLI | `scripts/sync-to-d1.js` 每日增量写入 D1 |

---

## 📁 项目结构

```
├── src/
│   ├── routes/
│   │   ├── index.tsx           # 首页：Tableau MCP 每日更新时间线
│   │   ├── api/
│   │   │   ├── updates.ts      # GET /api/updates - 查询 D1 提交记录
│   │   │   └── stats.ts        # GET /api/stats - 统计汇总
│   │   └── __root.tsx          # 根布局：kumo Provider + 全局样式
│   └── lib/
│       └── db-types.ts         # D1 表类型定义
├── data/
│   └── updates.json            # 本地缓存的 GitHub 提交原始数据（每日同步产出）
├── db/
│   └── migrations/
│       ├── 001_create_tables.sql      # 任务表（遗留，兼容旧功能）
│       └── 002_create_tableau_mcp_updates.sql  # 监控核心表
├── scripts/
│   └── sync-to-d1.js         # 同步脚本：读取 updates.json → 写入 D1
├── wrangler.jsonc            # Cloudflare 配置（D1/R2 绑定、兼容性日期）
├── vite.config.ts            # Vite + TanStack Router 配置
├── package.json              # 依赖与脚本（含 "build": "tsr generate && vite build"）
└── README.md                 # 本文档
```

---

## 🗄 数据库设计

### 核心表：`tableau_mcp_updates`

```sql
CREATE TABLE IF NOT EXISTS tableau_mcp_updates (
  commit_sha    TEXT PRIMARY KEY,           -- Git 提交 SHA (短)
  commit_date   DATE NOT NULL,              -- 提交日期 (YYYY-MM-DD)
  pr_number     TEXT,                       -- PR 编号 (如 "473")，无 PR 则为 NULL
  title         TEXT NOT NULL,              -- 提交标题
  summary       TEXT NOT NULL,              -- AI 生成的中文摘要
  author        TEXT NOT NULL,              -- 提交作者
  files_changed INTEGER,                    -- 变更文件数
  additions     INTEGER,                    -- 新增行数
  deletions     INTEGER,                    -- 删除行数
  commit_url    TEXT,                       -- GitHub 提交链接
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按日期倒序查询（首页时间线用）
CREATE INDEX idx_tableau_mcp_updates_date ON tableau_mcp_updates(commit_date DESC);
-- 索引：按 PR 编号查询
CREATE INDEX idx_tableau_mcp_updates_pr ON tableau_mcp_updates(pr_number);
```

### 元数据字段（来自 `updates.json.meta`）
- `source`: `"tableau/tableau-mcp"`
- `monitoring_since`: `"2026-06-01"`（监控起始日期）
- `last_sync`: `"2026-07-25"`（最后同步日期）
- `total_commits`: `38`（累计提交数）
- `generated_by`: `"tableau-mcp-daily-fetch"`

---

## 🚀 部署步骤

### 1️⃣ 前置条件
- Node.js ≥ 20（推荐 `nvm use 24.16.0`）
- `wrangler` CLI 已安装并登录（`wrangler login`）
- Cloudflare 账号下已创建：
  - D1 数据库：**tanstack-d1-database**（ID: `5d0df40f-69a8-4dc0-85eb-c9ab89129429`）
  - R2 Bucket：**tanstack-task-images**（预留）

### 2️⃣ 本地开发
```bash
# 克隆仓库
git clone https://github.com/theguagua/tanstack-d1-app.git
cd tanstack-d1-app

# 安装依赖
npm install

# 本地开发服务器（包含 D1 本地模拟）
npm run dev
# 访问 http://localhost:3000
```

### 3️⃣ 数据库迁移（首次部署）
```bash
# 执行迁移脚本，创建 tableau_mcp_updates 表
wrangler d1 execute tanstack-d1-database --file db/migrations/002_create_tableau_mcp_updates.sql
```

### 4️⃣ 首次数据同步
```bash
# 从本地 updates.json 导入数据到 D1
node scripts/sync-to-d1.js
# ✅ 输出示例：Database populated with 56 commits
```

### 5️⃣ 生产部署
```bash
# 构建（关键：先 tsr generate 生成 manifest，再 vite build）
npm run build

# 部署到 Cloudflare Workers/Pages
npx wrangler deploy
# 或使用 Git 集成：推送到 main 分支自动触发部署
git push origin main
```

---

## ⚙️ 自动化同步流程

### 方案 A：GitHub Actions + wrangler（推荐，零运维）
```yaml
# .github/workflows/daily-sync.yml
name: Daily D1 Sync
on:
  schedule:
    - cron: '15 7 * * *'   # 每天 07:15 UTC（约北京时间 15:15），配合 07:00 抓取
  workflow_dispatch:       # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1  # 或 node
      - run: bun install
      - name: Fetch latest commits
        run: node scripts/fetch-github-commits.js  # 需额外实现：调用 GitHub API 写入 updates.json
      - name: Sync to D1
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: node scripts/sync-to-d1.js
```

### 方案 B：Cloudflare Cron Trigger（Worker 原生，更轻量）
在 `wrangler.jsonc` 中添加：
```jsonc
{
  "triggers": {
    "crons": ["15 7 * * *"]
  }
}
```
并在 `worker.ts` 导出 `scheduled` 处理器调用同步逻辑（见下文）。

---

## 🔌 API 接口

| 端点 | 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|------|
| `/api/updates` | GET | `since` (date), `limit` (int, 默认 10) | `{ results: Commit[] }` | 按日期倒序查询提交记录 |
| `/api/stats` | GET | 无 | `{ total_commits, daily_stats[] }` | 统计汇总：总数 + 每日条数 |
| `/api/sync` | POST | 无 | `{ success: true, count }` | 手动触发同步（需鉴权） |

**示例响应**（`/api/updates?since=2026-07-20&limit=3`）：
```json
{
  "results": [
    {
      "commit_sha": "a1b2c3d",
      "commit_date": "2026-07-22",
      "pr_number": "553",
      "title": "Enforce stale-content row limits",
      "summary": "强制 stale-content 行数上限并加固 LUID 缓存",
      "author": "Alon Siman Tov",
      "files_changed": 3,
      "additions": 124,
      "deletions": 8,
      "commit_url": "https://github.com/tableau/tableau-mcp/commit/a1b2c3d"
    }
  ]
}
```

---

## 🎨 前端页面说明

### 首页（`src/routes/index.tsx`）
- **顶部状态栏**：显示 `last_sync` 日期、抓取/部署时间说明
- **每日分组**：Sticky 日期标签（竖向导轨 + 圆点），显示当日提交数 + PR 编号
- **提交卡片**：
  - Badge 区分 PR / 直接提交
  - SHA 短链接跳转 GitHub
  - 作者、中文摘要、原始标题
  - 文件变更统计：文件数 / +行数（绿） / -行数（红）
- **暗色模式**：跟随系统偏好，kumo 组件库原生支持
- **响应式**：移动端自动调整间距与字体

---

## 📝 常用命令速查

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run generate-routes        # 单独运行 tsr generate

# 数据库
wrangler d1 execute tanstack-d1-database --command "SELECT * FROM tableau_mcp_updates LIMIT 5"
wrangler d1 execute tanstack-d1-database --file db/migrations/002_create_tableau_mcp_updates.sql

# 同步
node scripts/sync-to-d1.js     # 本地同步 updates.json → D1

# 部署
npm run build                  # tsr generate && vite build
npx wrangler deploy            # 部署到 Cloudflare
npx wrangler pages deploy public  # 仅静态资源部署（如有）

# 日志查看
npx wrangler tail              # 实时 Workers 日志
```

---

## 🔐 环境变量与密钥

| 变量 | 用途 | 配置位置 |
|------|------|----------|
| `CLOUDFLARE_API_TOKEN` | wrangler 部署/执行 D1 命令 | `~/.config/cloudflare/env.sh` + GitHub Secrets |
| `CLOUDFLARE_ACCOUNT_ID` | D1/R2 操作所需账号 ID | GitHub Secrets |
| `DATABASE_ID` | D1 数据库 ID（已写死在 wrangler.jsonc） | `wrangler.jsonc` |

> **注意**：`env.sh` 格式为 `export KEY="value"`（等号两侧无空格），部署前需 `source ~/.config/cloudflare/env.sh`。

---

## 📈 监控与运维

- **站点地址**：<https://tanstack-d1-app.guaguaailife.workers.dev>
- **GitHub 仓库**：<https://github.com/theguagua/tanstack-d1-app>
- **数据源仓库**：<https://github.com/tableau/tableau-mcp>
- **Cloudflare Dashboard**：Workers & Pages → `tanstack-d1-app` → Logs / Metrics

### 告警建议
- 监控 `wrangler deploy` 失败率（GitHub Actions / Cron Trigger）
- 监控 D1 存储用量（`wrangler d1 info tanstack-d1-database`）
- 设置每日同步成功的心跳检测（可在 `/api/stats` 观察 `last_sync` 日期）

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/xxx`
3. 提交变更：`git commit -m "feat: xxx"`
4. 推送分支：`git push origin feat/xxx`
5. 发起 Pull Request

### 代码规范
- TypeScript 严格模式，`tsc --noEmit` 无错误
- ESLint + Prettier（`npm run lint` / `npm run format`）
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 许可证

MIT License © 2026 [theguagua](https://github.com/theguagua)

---

## 🙏 致谢

- [Tableau MCP](https://github.com/tableau/tableau-mcp) - 数据源
- [TanStack Start](https://tanstack.com/start) - 全栈框架
- [Cloudflare D1/R2/Workers](https://developers.cloudflare.com/) - 无服务器基础设施
- [@cloudflare/kumo](https://github.com/cloudflare/kumo) - 组件库