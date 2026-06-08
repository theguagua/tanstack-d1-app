# TanStack Start + D1/R2 任务管理应用

基于 TanStack Start 构建的全栈任务管理应用，支持图片上传，部署在 Cloudflare Workers。

## 技术栈

- **TanStack Start** - 全栈 React SSR 框架
- **Cloudflare D1** - SQLite 数据库存储任务数据
- **Cloudflare R2** - 对象存储用于图片上传
- **Tailwind CSS** - 样式框架

## 项目结构

```
├── src/
│   ├── routes/
│   │   ├── api/
│   │   │   ├── tasks/index.ts    # GET/POST 任务 API
│   │   │   └── upload.ts         # 图片上传 API
│   │   ├── tasks.tsx             # 任务管理页面
│   │   └── __root.tsx            # 根布局
│   └── lib/
│       └── db-types.ts           # 数据库类型定义
├── db/
│   └── migrations/
│       └── 001_create_tables.sql # 数据库迁移
├── wrangler.jsonc                   # Cloudflare 配置
└── vite.config.ts                   # Vite 配置
```

## 部署步骤

```bash
# 1. 创建 D1 数据库
wrangler d1 create tanstack-d1-database

# 2. 执行迁移
wrangler d1 execute tanstack-d1-database --file db/migrations/001_create_tables.sql

# 3. 创建 R2 bucket
wrangler r2 bucket create tanstack-task-images

# 4. 部署
npm run deploy
```

## API 路由

- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务（支持图片 key/url）
- `POST /api/upload` - 上传图片到 R2

## 开发

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```