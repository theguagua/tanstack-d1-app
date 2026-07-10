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
};

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
  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      {/* 顶部状态条 */}
      <section className="island-shell rise-in relative overflow-hidden rounded-[1.5rem] px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3 mb-3">
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
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--sea-ink-soft)]">
          <span>
            监控起点 <b className="text-[var(--sea-ink)]">{data.meta.monitoring_since}</b>
          </span>
          <span>
            最后同步 <b className="text-[var(--sea-ink)]">{data.meta.last_sync}</b>
          </span>
          <span>
            累计 commit <b className="text-[var(--sea-ink)]">{data.meta.total_commits}</b>
          </span>
          <span>
            有更新日 <b className="text-[var(--sea-ink)]">{dates.length}</b>
          </span>
        </div>
      </section>

      {/* 每日快照 */}
      <div className="mt-8 space-y-10">
        {dates.map((date) => {
          const day = data.updates[date];
          return (
            <section key={date} className="scroll-mt-24">
              <div className="sticky top-[60px] z-10 -mx-4 mb-4 flex items-center gap-3 border-y border-kumo-line bg-kumo-fill px-4 py-3 backdrop-blur-sm">
                <span className="flex h-7 items-center rounded-full bg-kumo-brand px-3 font-mono text-sm font-semibold text-white">
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
                    </div>

                    <Text variant="body" className="!text-[15px] !leading-relaxed">
                      {c.summary}
                    </Text>

                    <Text variant="secondary" size="xs" className="mt-1">
                      原文标题：{c.title}
                    </Text>

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

      <p className="mt-12 text-center text-xs text-[var(--sea-ink-soft)]">
        每日 07:00 抓取 / 07:15 总结并部署 · 仅展示最近 5 commits（历史日归档于上方）· 无更新不部署
      </p>
    </main>
  );
}
