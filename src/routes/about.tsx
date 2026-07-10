import { createFileRoute } from '@tanstack/react-router';
import { Breadcrumbs, LayerCard, Text, Link, Badge } from '@cloudflare/kumo';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      <Breadcrumbs className="mb-6">
        <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
        <Breadcrumbs.Separator />
        <Breadcrumbs.Current>About</Breadcrumbs.Current>
      </Breadcrumbs>

      <Text variant="heading1" as="h1" className="!text-3xl m-0">
        关于本项目
      </Text>
      <Text variant="secondary" className="mt-2">
        一个面向 Tableau MCP 生态的每日更新看板
      </Text>

      <div className="mt-8 space-y-6">
        <LayerCard className="p-6">
          <Text variant="heading3" as="h2" className="m-0">
            它是什么
          </Text>
          <Text variant="body" className="mt-2">
            Tableau MCP 每日更新 是一个自动监控面板，每日追踪{' '}
            <Link href="https://github.com/tableau/tableau-mcp" target="_blank" rel="noreferrer" variant="inline">
              github.com/tableau/tableau-mcp
            </Link>{' '}
            仓库的最近提交，并生成客观的中文摘要。目标是让中文使用者无需逐条阅读英文 commit，即可了解 Tableau MCP
            的演进节奏与重点改动。
          </Text>
        </LayerCard>

        <LayerCard className="p-6">
          <Text variant="heading3" as="h2" className="m-0">
            工作原理
          </Text>
          <ul className="mt-2 space-y-2 list-disc pl-5 text-[var(--kumo-default)]">
            <li>
              <Text variant="body">
                每日 07:00 通过 GitHub API 抓取最近 5 条 commit，并与上次部署的 commit 集合比对。
              </Text>
            </li>
            <li>
              <Text variant="body">
                若检测到新 commit，07:15 由代理生成中文摘要，合并进数据文件并部署到 Cloudflare。
              </Text>
            </li>
            <li>
              <Text variant="body">
                若无新提交，则跳过部署，不留下空记录。
              </Text>
            </li>
          </ul>
        </LayerCard>

        <LayerCard className="p-6">
          <Text variant="heading3" as="h2" className="m-0">
            技术栈
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">TanStack Start</Badge>
            <Badge variant="info">Cloudflare Workers</Badge>
            <Badge variant="info">D1 / R2</Badge>
            <Badge variant="info">Cloudflare kumo</Badge>
            <Badge variant="info">Tailwind CSS v4</Badge>
          </div>
          <Text variant="secondary" size="sm" className="mt-3">
            界面基于 Cloudflare 官方组件库 kumo 构建，并随系统外观自动切换明暗主题。
          </Text>
        </LayerCard>

        <LayerCard className="p-6">
          <Text variant="heading3" as="h2" className="m-0">
            数据来源与局限
          </Text>
          <Text variant="body" className="mt-2">
            摘要由自动代理基于 commit 标题与 PR 信息生成，力求客观、不夸大为原则；涉及具体实现细节时以原仓库为准。
            本面板仅作信息聚合之用，与 Tableau / Salesforce 官方无隶属关系。
          </Text>
        </LayerCard>
      </div>

      <p className="mt-10 text-center text-xs text-[var(--sea-ink-soft)]">
        监控起点 2026-06-01 · 部署于 Cloudflare (Git 集成)
      </p>
    </main>
  );
}
