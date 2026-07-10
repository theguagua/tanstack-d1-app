import { createFileRoute } from '@tanstack/react-router';
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
  files: number;
  additions: number;
  deletions: number;
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

function HomePage() {
  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      {/* 顶部状态条 */}
      <section className="island-shell rise-in relative overflow-hidden rounded-[1.5rem] px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--lagoon-deep)] flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)] m-0">
              Tableau MCP · 每日更新面板
            </h1>
            <p className="island-kicker m-0 mt-0.5">
              数据源 {' '}
              <a
                href={`https://${data.meta.source}`}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--lagoon-deep)] no-underline"
              >
                {data.meta.source}
              </a>{' '}
              · 部署 Cloudflare (Git 集成)
            </p>
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
            <section key={date}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-xl font-bold text-[var(--sea-ink)] m-0">{date}</h2>
                <span className="island-kicker">
                  今日 {day.count} 条
                  {day.prs.filter(Boolean).length > 0 && (
                    <span className="ml-2 text-[var(--sea-ink-soft)]">
                      #{day.prs.filter(Boolean).join(' #')}
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-3">
                {day.commits.map((c) => (
                  <article
                    key={c.sha}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 backdrop-blur-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {c.pr ? (
                        <span className="rounded-full bg-[var(--lagoon-deep)]/12 px-2.5 py-0.5 text-xs font-semibold text-[var(--lagoon-deep)]">
                          #{c.pr}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
                          commit
                        </span>
                      )}
                      <code className="text-xs text-[var(--sea-ink-soft)]">{c.sha}</code>
                      <span className="text-xs text-[var(--sea-ink-soft)]">· {c.author}</span>
                    </div>

                    <p className="m-0 text-[15px] leading-relaxed text-[var(--sea-ink)]">
                      {c.summary}
                    </p>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-[var(--lagoon-deep)] select-none">
                        原文标题
                      </summary>
                      <p className="mt-1 text-xs text-[var(--sea-ink-soft)] break-words">
                        {c.title}
                      </p>
                    </details>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--sea-ink-soft)]">
                      <span>{c.files} 文件</span>
                      <span className="text-green-600">+{c.additions}</span>
                      <span className="text-red-500">−{c.deletions}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-[var(--sea-ink-soft)]">
        ℹ️ 每日 07:00 抓取 / 07:15 总结并部署 · 仅展示最近 5 commits（历史日归档于上方）· 无更新不部署
      </p>
    </main>
  );
}
