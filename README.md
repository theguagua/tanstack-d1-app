# 📊 Tableau MCP 每日更新监控面板

追踪并可视化 [tableau/tableau-mcp](https://github.com/tableau/tableau-mcp) 仓库每日提交变动的监控面板。每天自动从 **官方 GitHub 仓库** 抓取最新 commits，由 LLM 生成中文解读，存入 **Cloudflare D1** 作为权威数据源，并通过 Cloudflare Workers 部署展示。

线上地址：https://tanstack-d1-app.guaguaailife.workers.dev

---

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| **每日自动抓取** | 每天 07:00 由定时任务从官方仓库 `tableau/tableau-mcp` 拉取最近 commits（以 HEAD sha 判定是否有新内容） |
| **中文解读** | 每条 commit 由 LLM 生成 `summary`（一句话总结）+ `explanation`（中文标题解读），写入数据文件 |
| **D1 权威存储** | 所有记录写入 Cloudflare D1（`tableau_mcp_updates` 表），网站以 D1 为准；每次同步后校验 D1 与本地数据一致 |
| **北京时间分组** | commit 按提交时间转换为北京时间（Asia/Shanghai）的日期分组，网页固定用北京时间展示 |
| **时间线可视化** | 竖向导轨 + 每日节点 + 卡片布局，支持暗色模式、移动端适配 |
| **PR / Commit 关联** | 自动解析 PR 编号、作者，一键跳转 GitHub 原始提交 |

---

## 🛠 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | TanStack Start (React) + 文件路由 |
| 样式系统 | @cloudflare/kumo (Tailwind v4) |
| 数据库 | Cloudflare D1 (SQLite)，库名 `tanstack-d1-database`，绑定名 `DB` |
| 对象存储 | Cloudflare R2 `tanstack-task-images`（预留） |
| 构建 | Vite + TypeScript（`npm run build` = `tsr generate && vite build`） |
| 部署 | Cloudflare Workers（`wrangler deploy`） |
| 数据同步 | Cloudflare D1 REST API（Python 脚本，见下） |
| 调度 | Hermes Agent cron（见「自动同步机制」） |

---

## 📁 项目结构

```text
├── src/
│   ├── routes/
│   │   ├── index.tsx             # 主页：时间线（构建时烘焙 updates.json 作展示）
│   │   ├── api/
│   │   │   ├── updates.ts        # GET /api/updates - 实时读 D1 返回提交记录
│   │   │   └── stats.ts          # GET /api/stats - 统计汇总
│   │   └── __root.tsx            # 根布局
│   ├── sync.ts                   # Worker 内 D1 建表/灌入逻辑（mainSync）
│   └── lib/db-types.ts           # D1 表结构类型
├── data/
│   └── updates.json              # 本地数据草稿（含中文 summary/explanation），灌 D1 的输入
├── db/migrations/                # 建表 SQL（D1 实际由脚本/Worker 自动建）
├── scripts/
│   └── sync-to-d1.cjs            # 旧同步脚本（依赖 wrangler，本地 macOS 无法运行，保留备用）
├── worker.ts                     # Worker 入口：路由 /api/* + 委托 TanStack 应用
├── wrangler.jsonc                # Cloudflare 配置（D1、R2、Cron Trigger）
└── README.md
```

> ⚠️ **数据源 vs 部署源**
> - **数据源（抓取）**：官方仓库 `https://github.com/tableau/tableau-mcp.git`
> - **部署源（本仓库）**：`https://github.com/theguagua/tanstack-d1-app.git`（fork，仅承载代码）
>
> 两者不同。抓取脚本 clone 的是官方仓库，确保不漏官方更新；本仓库只负责部署站点代码。

---

## 🚀 本地开发 & 部署

```bash
# 本地开发
npm install
npm run dev                  # http://localhost:3000

# 构建 + 部署到 Cloudflare Workers
npm run build
source ~/.config/cloudflare/env.sh
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_KEY"   # wrangler 4.x 要求 token 变量
npm run deploy              # = build + wrangler deploy
```

> 静态页在构建时把 `data/updates.json` 烘焙进前端，因此**数据更新后需重新 `wrangler deploy`** 才能让页面反映新内容（每天一更，频率足够）。D1 则是运行时实时数据。

---

## 📡 API 路由

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/updates` | GET | 实时从 D1 读取提交记录，`since`（日期，可选）、`limit`（默认 10）参数；按日期倒序 |
| `/api/stats` | GET | 按日期分组的提交统计 |
| `/api/sync` | POST | 触发 Worker 内部 `mainSync`（依赖构建时烘焙的 JSON，**不可靠，勿依赖**） |

**`/api/updates` 示例响应：**

```json
{
  "success": true,
  "meta": { "served_by": "v3-prod", "duration": 0.3 },
  "results": [
    {
      "commit_sha": "e00fa5fc",
      "commit_date": "2026-08-21",
      "pr_number": "809",
      "title": "@W-20005560: Undoing the consolidation of FFs for staging files in S3 (#809)",
      "summary": "#809 撤销此前对 S3 暂存文件 feature flag 的合并（FF 拆分回各自独立开关）。",
      "author": "Yogi",
      "files_changed": 0,
      "additions": 0,
      "deletions": 0,
      "commit_url": "https://github.com/tableau/tableau-mcp/commit/e00fa5fc"
    }
  ]
}
```

---

## 🔄 自动同步机制

数据管道由 **Hermes Agent 的 cron 任务**驱动（非 GitHub Actions / 非 Worker Cron Trigger）：

```
官方 GitHub (tableau/tableau-mcp)
  │ 07:00  fetch 阶段：git clone/pull 官方仓库，按 HEAD sha 判定新 commit
  ▼
raw-latest.json            （中间态，最近 25 条原始 commits）
  │ 07:15  summarize 阶段：LLM 读 raw，生成中文 summary + explanation，
  │       合并进 data/updates.json（按北京时间日期分组、倒序）
  ▼
data/updates.json          （本地草稿，含中文解读）
  │ ① wrangler deploy  → 烘焙进静态页
  │ ② sync-tableau-d1.py → 灌入 Cloudflare D1   ← 权威数据源
  │ ③ verify-tableau-d1.py → 校验 D1 与 updates.json 一致
  ▼
Cloudflare D1  ⇄  网站（/api/updates 实时读 D1；主页用烘焙页）
```

### 关键脚本（位于 `~/.hermes/scripts/`，不在本仓库）

| 脚本 | 作用 |
|------|------|
| `sync-tableau-d1.py` | 用 Cloudflare D1 REST API 把 `updates.json` 灌入 D1。建表 → 清空 → 按 10 行/批 INSERT（D1 单语句参数上限 100）→ count 校验。幂等 |
| `verify-tableau-d1.py` | 比对 D1 的 sha 集合 + count 与 `updates.json`，不一致非零退出 |

```bash
# 同步 D1（需本地 Cloudflare 凭据）
source ~/.config/cloudflare/env.sh
export CF_ACCOUNT_ID=137c8f8351f90b7ab79fbc41ea2117f0
python3 ~/.hermes/scripts/sync-tableau-d1.py
python3 ~/.hermes/scripts/verify-tableau-d1.py   # 必须跑，确认 D1 == updates.json
```

> **为什么用 REST API 而不是直接 `wrangler d1 execute`？**
> 本地 macOS 12.7 低于 workerd 要求的 13.5，即使加 `--remote`，`wrangler d1` 仍会尝试启动本地 workerd 而失败。D1 REST API 在服务端执行，无此限制。

> **为什么不直接用 Worker 的 `/api/sync` 或 02:00 Cron Trigger？**
> 它们依赖构建时烘焙进 Worker 的 JSON bundle，实践中会静默让 D1 落后于静态页（页面看着是最新的，D1 却是空的/旧的）。REST 脚本 + verify 才是可观测、可靠的路径。

---

## 📌 注意事项

- **凭证**：Cloudflare 凭据在 `~/.config/cloudflare/env.sh`（chmod 600，仅本地，不进 git/记忆备份）。`CLOUDFLARE_API_KEY`（Global API Key）+ `CLOUDFLARE_EMAIL`。
- **模型**：cron 的总结任务使用默认模型 `tencent/hy3:free` / `nous`（需支持工具调用）。勿硬写易下线的免费模型（如 `opencode-zen` 的 `deepseek-v4-flash-free` 已于 2026-08-21 停服）。
- **数据一致性铁律**：每次同步后必须 `verify-tableau-d1.py` 通过，否则不视为成功。
- **北京时间**：所有日期分组与展示统一用 Asia/Shanghai，避免时区不一致。

---

✅ 本面板每天自动从官方 Tableau MCP 仓库抓取更新，经中文解读后同步至 Cloudflare D1，并以 D1 为权威数据源对外提供查询。
