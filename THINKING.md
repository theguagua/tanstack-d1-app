# 构建思路

## 架构决策

1. **TanStack Start 选择** - 使用 Cloudflare 部署 preset，因为原生支持 Workers 和绑定
2. **数据库设计** - 简化版任务管理，支持图片字段存储 R2 key 和 URL
3. **图片上传策略** - 直传 Workers 函数上传到 R2（后期可优化为预签名 URL）
4. **认证** - 当前简化为 `userId = 1`，后期可集成 Clerk/Auth.js

## Cloudflare 资源配置

- D1: `tanstack-d1-database` - SQLite 兼容
- R2: `tanstack-task-images` - 图片存储 bucket

## 遇到的问题

1. TanStack Start CLI 创建项目时 npm install 超时 - 通过手动补全依赖解决
2. API 路由需要在同一文件内处理多个方法（GET/POST）

## 后续优化

- [ ] 添加 TanStack Query 客户端缓存
- [ ] 图片 CDN 优化（自定义域名）
- [ ] 任务状态筛选和搜索
- [ ] 分类管理功能