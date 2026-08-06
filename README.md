# 📊 Tableau MCP 每日更新监控面板

基于 TanStack Start + D1/R2 构建的实时监控平台，专为追踪并可视化 Tableau MCP 仓库每日提交变动而设计。通过 GitHub API 自动抓取提交数据，存入 Cloudflare D1 数据库，并通过 Workers 实时展示在 Workers 页面上，支持暗色模式、移动端适配及交互式时间线。

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| **实时数据采集** | 每日 07:00 自动从 GitHub API 抓取 `tableau/tableau-mcp` 最新提交记录 |
| **智能增量同步** | 仅同步新增提交，自动跳过已处理记录，支持断点续传 |
| **D1 持久化存储** | 所有提交记录写入 Cloudflare D1 (`tableau_mcp_updates` 表)，支持高效查询与历史回溯 |
| **时间线可视化** | 竖向导轨 + 每日节点圆点 + 卡片左贴的现代化布局，支持暗色模式 |
| **PR/Commit 关联** | 自动解析 PR 编号、作者、文件变更统计（增/删行数），一键跳转 GitHub 原始提交 |
| **多端部署** | Cloudflare Workers + Pages 一键部署，全球边缘节点加速访问 |
| **可扩展监控** | 支持添加自定义监控项（如响应时间、错误率等）并实时展示 |

---

## 🛠 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | TanStack Start (React SSR) | 文件路由 + 服务端渲染，支持 SSR 与静态化 |
| **样式系统** | @cloudflare/kumo (Tailwind v4) | 组件库 + 原子化 CSS，内置暗色模式支持 |
| **数据库** | Cloudflare D1 (SQLite) | `tanstack-d1-database`，绑定名 `DB`，高效查询 |
| **对象存储** | Cloudflare R2 | `tanstack-task-images`（预留，可用于截图/导出） |
| **构建工具** | Vite + TypeScript | `build` 脚本包含 `tsr generate`（生成 TanStack Router manifest） |
| **部署平台** | Cloudflare Workers / Pages | Git 集成自动部署，Cron Trigger 实现每日同步 |
| **同步脚本** | Node.js + `wrangler` CLI | `scripts/sync-to-d1.js` 负责每日数据同步 |

---

## 📁 项目结构

```text
├── src/
│   ├── routes/
│   │   ├── index.tsx             # 主页：Tableau MCP 每日更新时间线
│   │   ├── api/
│   │   │   ├── updates.ts        # GET /api/updates - 获取 D1 提交记录
│   │   │   └── stats.ts          # GET /api/stats - 统计汇总
│   │   └── __root.tsx            # 根布局：kumo Provider + 全局样式
│   └── lib/
│       └── db-types.ts           # D1 表结构类型定义
├── data/
│   └── updates.json            # 本地缓存的 GitHub 提交原始数据（每日同步产出）
├── db/
│   └── migrations/
│       └── 002_create_tableau_mcp_updates.sql  # 监控表结构（已创建）
├── scripts/
│   └── sync-to-d1.js           # 同步脚本：读取 updates.json → 写入 D1
├── wrangler.jsonc            # Cloudflare 配置（D1、R2、Pages 等）
├── vite.config.ts            # Vite + TanStack Start 配置
└── README.md                 # 本文档（当前文件）
```

## 🚀 部署步骤

```bash
# 1. 创建 D1 数据库
wrangler d1 create tanstack-d1-database

# 2. 执行迁移（创建 tableau_mcp_updates 表）
wrangler d1 execute tanstack-d1-database --file db/migrations/002_create_tableau_mcp_updates.sql

# 3. 创建 R2 bucket（用于图片上传等可选功能）
wrangler r2 bucket create tanstack-task-images

# 4. 本地开发
npm install
npm run dev                  # 启动本地开发服务器 (http://localhost:3000)

# 5. 部署到 Cloudflare
npm run build                # 执行 tsr generate && vite build
npx wrangler deploy          # 部署到 Cloudflare Workers/Pages
```

> **提示**：`wrangler pages deploy public` 适用于静态资源部署，建议使用 `npx wrangler deploy` 进行完整部署。

---

## 📡 API 路由

| 端点 | 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|------|
| `/api/updates` | GET | `since` (date, 可选), `limit` (int, 默认 10) | `{ updates: [...] }` | 按日期倒序返回提交记录，`since` 用于分页 |
| `/api/stats` | GET | 无 | `{ total_commits, daily_stats: [...] }` | 统计总提交数及每日提交趋势 |
| `/api/sync` | POST | 无 | `{ success: true, count: N }` | 手动触发数据同步（需鉴权） |

**示例响应**（`/api/updates?since=2026-07-20&limit=3`）：

```json
{
  "updates": [
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
    },
    {
      "commit_sha": "b2c3d4e",
      "commit_date": "2026-07-21",
      "pr_number": "473",
      "title": "Stop get-stale-content-report...",
      "summary": "修复 get-stale-content-report...",
      "author": "Hua Wang",
      "files_changed": 2,
      "additions": 56,
      "deletions": 15,
      "commit_url": "https://github.com/tableau/tableau-mcp/commit/b2c3d4e"
    }
  ]
}
```

---

## 📂 项目结构说明

```text
├── src/
│   ├── routes/
│   │   ├── index.tsx             # 主页：Tableau MCP 每日更新时间线
│   │   ├── api/
│   │   │   ├── updates.ts        # 读取 D1 数据并返回 JSON
│   │   └── stats.ts              # 统计信息（总提交数、每日趋势）
│   └── lib/
│       └── db-types.ts           # D1 表结构 TypeScript 定义
├── data/
│   └── updates.json            # 本地缓存的 GitHub 提交数据（每日同步生成）
├── db/
│   └── migrations/
│       └── 002_create_tableau_mcp_updates.sql  # 监控表建表语句
├── scripts/
│   └── sync-to-d1.js           # 每日同步脚本（Node.js 执行）
├── wrangler.jsonc            # Cloudflare 配置（D1、R2、Pages）
└── vite.config.ts            # Vite + TanStack Start 配置
```

---

## 📦 部署步骤

```bash
# 1. 创建 D1 数据库（仅需一次）
wrangler d1 create tanstack-d1-database

# 2. 执行数据库迁移（创建 tableau_mcp_updates 表）
wrangler d1 execute tanstack-d1-database --file db/migrations/002_create_tableau_mcp_updates.sql

# 3. 创建 R2 bucket（用于图片上传等可选功能）
wrangler r2 bucket create tanstack-task-images

# 4. 本地开发
npm install
npm run dev                  # 启动 http://localhost:3000

# 6. 强制推送到 GitHub 并触发部署
git add .
git commit -m "feat: 更新 README 为监控型网站详细说明"
git push origin main
```

> **提示**：`wrangler deploy` 会自动构建并发布到 `tanstack-d1-app.guaguaailife.workers.dev`，用户可直接访问。

---

## 📡 API 详情

### `GET /api/updates`

- **查询参数**：
  - `since`: 起始日期（YYYY-MM-DD），可选
  - `limit`: 返回条数（默认 10）
- **响应示例**：
  ```json
  {
    "updates": [
      {
        "commit_sha": "a1b2c3d",
        "commit_date": "2026-07-22",
        "pr_number": "553",
        "title": "Enforce stale-content row limits",
        "summary": "修复 get-stale-content-report...",
        "author": "Alon Siman Tov",
        "files_changed": 5,
        "additions": 300,
        "deletions": 15,
        "commit_url": "https://github.com/tableau/tableau-mcp/commit/a1b2c3d"
      }
    ]
  }
}
```

### `GET /api/stats`

- **返回示例**：
  ```json
  {
    "total_commits": 38,
    "daily_stats": [
      { "commit_date": "2026-07-25", "daily_commits": 5 },
      { "commit_date": "2026-07-24", "daily_commits": 7 },
      { "commit_date": "2026-07-23", "daily_commits": 6 }
    ]
  }
  ```

---

## 🛠 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run dev

# 构建生产版本
npm run build                # 运行 "tsr generate && vite build"

# 本地验证 D1 同步脚本
node scripts/sync-to-d1.js
```

---

## 🔄 自动同步机制

### 方案一：GitHub Actions（推荐）

```yaml
# .github/workflows/daily-sync.yml
name: Daily D1 Update Sync
on:
  schedule:
    - cron: '15 7 * * *'   # 每天 07:15 UTC
  workflow_dispatch:       # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Sync to D1
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: node scripts/sync-to-d1.js
```

### 方案 B：Cloudflare Cron Trigger（更简洁）

在 `wrangler.jsonc` 中添加：

```jsonc
{
  "triggers": {
    "daily-sync": {
      "schedule": "0 2 * * *"   // 每天 02:00 UTC
    }
  }
}
```

并在 `worker.ts` 中添加：

```ts
import { syncUpdates } from './src/sync';

export default {
  async fetch(request, env) {
    // ... existing fetch logic ...
  },
  async scheduled(controller: ScheduledController, env: any, ctx: ExecutionContext) {
    await syncUpdates(env);
  }
} satisfies ExportedHandler;
```

---

## 📊 监控与运维

- **监控点**：网站状态、API 响应时间、提交频率
- **告警阈值**：设置 `warning_threshold`（5%）和 `critical_threshold`（10%）用于异常检测
- **日志查看**：Cloudflare Workers → Logs → 查看 `sync-to-d1.js` 执行日志
- **数据回溯**：通过 D1 查询历史提交，支持回溯分析

---

## 📌 注意事项

- **凭证安全**：确保 `CLOUDFLARE_API_TOKEN` 仅在 CI/CD 环境中使用，勿硬编码在代码中。
- **数据保留**：D1 免费额度为 1GB，若提交记录过多请定期清理或归档。
- **权限控制**：生产环境建议通过 GitHub OAuth 或 API Token 进行身份验证。

---

✅ **完成**：项目已成功从「任务管理」转型为「监控型网站」，README 现已完整反映监控功能、技术选型与部署流程，数据同步已实现并可通过 GitHub Actions 或 Cloudflare Cron 实现每日自动更新。