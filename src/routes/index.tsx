// src/routes/index.tsx - Updated to display Chinese explanations
import { createFileRoute } from '@tanstack/react-router';
import { LayerCard, Text, Link, Badge } from '@cloudflare/kumo';
import updatesData from '../../data/updates.json';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type CommitItem = {
  sha: string;
  pr: string | null;
  title: string;
  summary: string;
  author: string;
  files: number | null;
  additions: number | null;
  deletions: number | null;
  explanation: string; // Add explanation field
  date?: string; // ISO 8601 commit time
};

// 把 ISO 提交时间格式化为友好显示。
// 固定用北京时间(Asia/Shanghai)渲染，与 updates.json 的分组日期(北京日期)保持一致，
// 避免不同浏览者本地时区导致的「分组日期 ≠ 卡片时钟日期」不一致。
function formatCommitTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

type DayUpdate = {
  count: number;
  prs: (string | null)[];
  commits: CommitItem[];
};

const data = updatesData as {
  meta: {
    source: string;
    monitoring_since: string;
    last_sync: string;
    total_commits: number;
    generated_by: string;
  };
  updates: Record<string, DayUpdate>;
};

const dates = Object.keys(data.updates);
const SITE_TITLE = 'Tableau MCP 每日更新';
const GITHUB_REPO = 'https://github.com/tableau/tableau-mcp';

function commitUrl(sha: string) {
  return `${GITHUB_REPO}/commit/${sha}`;
}

function HomePage() {
  const lastSync = data.meta.last_sync;
  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      {/* 顶部标题 + 同步状态（同一视觉家族，不再有独立数字状态条） */}
      <section className="island-shell rise-in relative overflow-hidden rounded-[1.5rem] px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text variant="heading1" as="h1" className="!text-2xl !font-bold m-0">
              {SITE_TITLE}
            </Text>
            <Text variant="secondary" size="sm" className="mt-0.5">
              数据源{' '}
              <Link href={`https://${data.meta.source}`} target="_blank" rel="noreferrer" variant="inline">
                {data.meta.source}
              </Link>{' '}
              · 部署于 Cloudflare
            </Text>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-kumo-fill px-3 py-1.5 text-xs font-medium text-kumo-strong ring-1 ring-kumo-line">
            <span className="h-2 w-2 rounded-full bg-kumo-success" />
            已同步 {lastSync}
          </span>
        </div>
      </section>

      {/* 背景时间线，贯穿整页的竖导轨 + 每日节点 + 卡片 */}
      <div className="relative mt-8">
        {/* 竖导轨 */}
        <span className="pointer-events-none absolute left-[15px] top-3 bottom-3 w-px bg-kumo-line" aria-hidden />

        <div className="space-y-10">
          {dates.map((date, i) => {
            const day = data.updates[date];
            const isLatest = i === 0;
            return (
              <section key={date} className="relative scroll-mt-24 pl-11">
                {/* 节点圆点：落在导轨上，ring 制造穿越切口 */}
                <span
                  className={`absolute left-[8px] top-[7px] h-3.5 w-3.5 rounded-full ring-4 ring-kumo-base ${isLatest ? 'bg-kumo-brand' : 'bg-kumo-base ring-1 ring-kumo-line'}`}
                  aria-hidden
                />

                {/* 日期节点标签 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex h-7 items-center rounded-full px-3 font-mono text-sm font-semibold ${isLatest ? 'bg-kumo-brand text-white' : 'bg-kumo-fill text-kumo-strong'}`}
                  >
                    {date}
                  </span>
                  <span className="island-kicker !mt-0">
                    当日 {day.count} 条
                    {day.prs.filter(Boolean).length > 0 && (
                      <span className="ml-2 text-[var(--sea-ink-soft)]">
                        #{day.prs.filter(Boolean).join(' #')}
                      </span>
                    )}
                  </span>
                </div>

                {/* 当天 commit 卡片：左贴导轨，与节点同组 */}
                <div className="space-y-3">
                  {day.commits.map((c) => (
                    <LayerCard key={c.sha} className="p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {c.pr ? (
                          <Badge variant="primary">#{c.pr}</Badge>
                        ) : (
                          <Badge variant="outline">commit</Badge>
                        )}

                        <Link
                          href={commitUrl(c.sha)}
                          target="_blank"
                          rel="noreferrer"
                          variant="plain"
                          className="font-mono text-xs"
                        >
                          {c.sha}
                        </Link>
                        <span className="text-xs text-[var(--sea-ink-soft)]">· {c.author}</span>
                        {c.date && (
                          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
                            · {formatCommitTime(c.date)}
                          </span>
                        )}
                      </div>

                      {/* 显示原文标题和中文解读 */}
                      <Text variant="body" className="!text-[15px] !leading-relaxed">
                        {c.summary}
                      </Text>

                      <Text variant="secondary" size="xs" className="mt-1">
                        原文标题：{c.title}
                      </Text>

                      {/* 显示中文解读区块 */}
                      <div className="mt-2 rounded border border-kumo-fill bg-kumo-fill/5 p-2 text-sm">
                        <Text variant="subtitle" className="font-medium">
                          中文标题解读：
                        </Text>
                        <Text variant="body" className="mt-1" copyable={c.explanation}>
                          {c.explanation}
                        </Text>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--sea-ink-soft)]">
                        <span>{c.files ?? 0} 文件</span>
                        <span className="text-[var(--kumo-success)]">+{c.additions ?? 0}</span>
                        <span className="text-[var(--kumo-danger)]">−{c.deletions ?? 0}</span>
                      </div>
                    </LayerCard>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-[var(--sea-ink-soft)]">
        每日 07:00 抓取 / 07:15 总结并部署 · 覆盖 {data.meta.monitoring_since} 起全部有更新的日期 · 无更新不部署
      </p>
    </main>
  );
}