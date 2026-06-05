"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RaceReplay } from "@/components/PerformanceBlocks";
import { compactText, formatDuration, rankLabel } from "@/lib/format";
import type { ResultDetailResponse, ResultEntry, ResultListResponse } from "@/lib/types";

const empty = { q: "", group: "", project: "", division: "", status: "" };

export default function RankExplorer() {
  const router = useRouter();
  const [filters, setFilters] = useState(empty);
  const [data, setData] = useState<ResultListResponse | null>(null);
  const [selected, setSelected] = useState<ResultEntry | null>(null);
  const [detail, setDetail] = useState<ResultDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: "1", pageSize: "25" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    fetch(`/api/results?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res, "数据加载失败"));
        return res.json();
      })
      .then((body: ResultListResponse) => {
        setData(body);
        setError("");
        setSelected((current) => {
          if (!current) return body.results[0] ?? null;
          return body.results.some((entry) => sameEntry(entry, current)) ? current : body.results[0] ?? null;
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [filters]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ division: selected.divisionCode });
    setDetail(null);
    fetch(`/api/results/${encodeURIComponent(selected.bib)}?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res, "详情加载失败"));
        return res.json();
      })
      .then(setDetail)
      .catch((err) => {
        if (err.name !== "AbortError") setDetail(null);
      });
    return () => controller.abort();
  }, [selected]);

  const options = useMemo(() => data?.filters ?? { groups: [], projects: [], divisions: [] }, [data]);
  const updateFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const openEntry = (entry: ResultEntry) => router.push(resultHref(entry));

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="brand-shell overflow-hidden rounded border border-[var(--brand-navy)] bg-white">
          <div className="brand-stripe" aria-hidden="true" />
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-20 shrink-0 place-items-center rounded-sm bg-[var(--brand-navy)] p-2">
                <img src="/brand/vork-mark-lime.png" alt="VORK 图形标" className="h-auto w-full" />
              </div>
              <div className="min-w-0">
                <img src="/brand/vork-wordmark.png" alt="VORK" className="h-5 w-auto" />
                <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--brand-navy)] sm:text-3xl">
                  {data?.event.name ?? "首都高校体能竞速邀请赛"}
                </h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Metric label="总人数" value={data?.summary.total ?? "-"} />
              <Metric label="已排名" value={data?.summary.ranked ?? "-"} />
              <Metric label="罚时" value={data?.summary.appliedPenaltyCount ?? "-"} />
              <Metric label="数据源" value={data?.source === "supabase" ? "Supabase" : "本地"} />
            </div>
          </div>
        </header>

        <section className="grid gap-3 rounded border border-[var(--line)] bg-white p-3 shadow-sm lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="姓名 / 号码 / 学校"
              aria-label="搜索"
              className="h-11 w-full rounded border border-[var(--line)] bg-white pl-9 pr-3 text-[var(--ink)]"
            />
          </label>
          <Select value={filters.group} onChange={(group) => updateFilter("group", group)} options={options.groups} label="组别" />
          <Select value={filters.project} onChange={(project) => updateFilter("project", project)} options={options.projects} label="项目" />
          <Select
            value={filters.division}
            onChange={(division) => updateFilter("division", division)}
            options={options.divisions.map((division) => division.code)}
            label="分组"
          />
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            aria-label="状态"
            className={selectClassName}
          >
            <option value="">全部</option>
            <option value="ranked">已排名</option>
            <option value="penalty">有罚时</option>
          </select>
          <button
            type="button"
            title="重置"
            aria-label="重置筛选"
            onClick={() => setFilters(empty)}
            className="grid h-11 w-11 place-items-center rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] text-[var(--brand-navy)] transition hover:bg-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </section>

        {error ? <section className="rounded border border-[var(--red)] bg-white p-6 text-sm text-[var(--red)]">{error}</section> : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="overflow-hidden rounded border border-[var(--line)] bg-white shadow-sm">
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="sticky top-0 bg-[var(--brand-navy)] text-left text-white">
                  <tr>
                    {["名次", "号码", "姓名/队名", "学校", "分组", "净成绩", "罚时", "最终成绩", "状态"].map((head) => (
                      <th key={head} className="border-b border-[rgba(255,255,255,0.18)] px-3 py-3 font-bold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.results ?? []).map((entry) => (
                    <tr
                      key={`${entry.divisionCode}-${entry.bib}`}
                      role="link"
                      tabIndex={0}
                      title="打开完整详情"
                      onClick={() => openEntry(entry)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEntry(entry);
                        }
                      }}
                      className={`cursor-pointer border-b border-[var(--line)] transition hover:bg-[var(--brand-soft)] ${
                        selected && sameEntry(selected, entry) ? "bg-[var(--brand-soft)] shadow-[inset_4px_0_0_var(--brand-lime)]" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-black">{entry.finalRank ?? "-"}</td>
                      <td className="px-3 py-3">{entry.bib}</td>
                      <td className="px-3 py-3 font-bold">{entry.displayName}</td>
                      <td className="px-3 py-3">{compactText(entry.school)}</td>
                      <td className="px-3 py-3">{entry.divisionName}</td>
                      <td className="px-3 py-3">{entry.netTimeText || formatDuration(entry.netTimeMs)}</td>
                      <td className="px-3 py-3 text-[var(--red)]">{entry.appliedPenaltyText || formatDuration(entry.appliedPenaltyMs)}</td>
                      <td className="px-3 py-3 font-black">{entry.finalTimeText || formatDuration(entry.finalTimeMs)}</td>
                      <td className="px-3 py-3">{entry.status}</td>
                    </tr>
                  ))}
                  {!error && data?.results.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-sm text-[var(--muted)]">
                        暂无数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded border border-[var(--line)] bg-white p-4 shadow-sm">
            {selected ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--muted)]">{selected.bib}</p>
                    <h2 className="text-xl font-black text-[var(--brand-navy)]">{selected.displayName}</h2>
                    <p className="text-sm text-[var(--muted)]">{selected.divisionName}</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded bg-[var(--brand-navy)] p-2">
                    <img src="/brand/vork-mark-lime.png" alt="" className="h-auto w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="最终名次" value={rankLabel(selected.finalRank)} />
                  <Metric label="最终成绩" value={selected.finalTimeText || formatDuration(selected.finalTimeMs)} />
                  <Metric label="净成绩" value={selected.netTimeText || formatDuration(selected.netTimeMs)} />
                  <Metric label="应用罚时" value={selected.appliedPenaltyText || formatDuration(selected.appliedPenaltyMs)} />
                </div>
                <Link
                  href={resultHref(selected)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:bg-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  完整详情页
                </Link>
                <div className="rounded border border-[var(--line)] p-3 text-sm">
                  <p className="font-bold text-[var(--brand-navy)]">违例/复核</p>
                  <p className="mt-1 text-[var(--muted)]">
                    {detail?.judgingDecision.label
                      ? `${detail.judgingDecision.label}：${compactText(detail.judgingDecision.reasons[0], "无")}`
                      : compactText(selected.note || selected.penaltyStatus, "无")}
                  </p>
                </div>
                {detail?.raceReplay.length ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-[var(--brand-navy)]">Race Replay</p>
                    <RaceReplay steps={detail.raceReplay} compact />
                  </div>
                ) : null}
                {detail?.workoutSummary.sections.length ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-[var(--brand-navy)]">Workout Summary</p>
                    {detail.workoutSummary.sections.slice(0, 6).map((section) => (
                      <div key={section.zone} className="rounded border border-[var(--line)] px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-[var(--brand-navy)]">{section.label}</strong>
                          <span>{section.totalTimeText}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          跑 {section.runTimeText} / 项 {section.stationTimeText} / 换 {section.transitionTimeText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">暂无数据</p>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className={selectClassName}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function sameEntry(a: Pick<ResultEntry, "bib" | "divisionCode">, b: Pick<ResultEntry, "bib" | "divisionCode">) {
  return a.bib === b.bib && a.divisionCode === b.divisionCode;
}

function resultHref(entry: Pick<ResultEntry, "bib" | "divisionCode">) {
  return `/results/${encodeURIComponent(entry.divisionCode)}/${encodeURIComponent(entry.bib)}`;
}

async function responseError(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

const selectClassName = "h-11 rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]";
