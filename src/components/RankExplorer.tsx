"use client";

import { RotateCcw, Search, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { compactText, formatDuration, rankLabel } from "@/lib/format";
import type { ResultDetailResponse, ResultEntry, ResultListResponse } from "@/lib/types";

const empty = { q: "", group: "", project: "", division: "", status: "" };

export default function RankExplorer() {
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
        if (!res.ok) throw new Error((await res.json()).error ?? "数据加载失败");
        return res.json();
      })
      .then((body: ResultListResponse) => {
        setData(body);
        setError("");
        setSelected((current) => current ?? body.results[0] ?? null);
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
    const params = new URLSearchParams({ division: selected.divisionCode });
    fetch(`/api/results/${encodeURIComponent(selected.bib)}?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "详情加载失败");
        return res.json();
      })
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selected]);

  const options = useMemo(() => data?.filters ?? { groups: [], projects: [], divisions: [] }, [data]);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center bg-[var(--lime)] text-sm font-black text-black">
              VR
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--green)]">Vork Rank</p>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">
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
        </header>

        <section className="grid gap-3 rounded border border-[var(--line)] bg-white p-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="姓名 / 号码 / 学校"
              className="h-11 w-full rounded border border-[var(--line)] bg-white pl-9 pr-3"
            />
          </label>
          <Select value={filters.group} onChange={(group) => setFilters({ ...filters, group })} options={options.groups} label="组别" />
          <Select value={filters.project} onChange={(project) => setFilters({ ...filters, project })} options={options.projects} label="项目" />
          <Select
            value={filters.division}
            onChange={(division) => setFilters({ ...filters, division })}
            options={options.divisions.map((division) => division.code)}
            label="分组"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="h-11 rounded border border-[var(--line)] bg-white px-3"
          >
            <option value="">全部</option>
            <option value="ranked">已排名</option>
            <option value="penalty">有罚时</option>
          </select>
          <button
            type="button"
            title="重置"
            onClick={() => setFilters(empty)}
            className="grid h-11 w-11 place-items-center rounded border border-[var(--line)] bg-[var(--lime)]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </section>

        {error ? (
          <section className="rounded border border-[var(--line)] bg-white p-6 text-sm text-[var(--red)]">{error}</section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="overflow-hidden rounded border border-[var(--line)] bg-white">
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="sticky top-0 bg-[#eef4e7] text-left">
                  <tr>
                    {["名次", "号码", "姓名/队名", "学校", "分组", "净成绩", "罚时", "最终成绩", "状态"].map((head) => (
                      <th key={head} className="border-b border-[var(--line)] px-3 py-3 font-bold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.results ?? []).map((entry) => (
                    <tr
                      key={`${entry.divisionCode}-${entry.bib}`}
                      onClick={() => setSelected(entry)}
                      className={`cursor-pointer border-b border-[var(--line)] hover:bg-[#f6faef] ${
                        selected?.bib === entry.bib && selected.divisionCode === entry.divisionCode ? "bg-[#f0f8df]" : ""
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
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded border border-[var(--line)] bg-white p-4">
            {selected ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--muted)]">{selected.bib}</p>
                    <h2 className="text-xl font-black">{selected.displayName}</h2>
                    <p className="text-sm text-[var(--muted)]">{selected.divisionName}</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded bg-[var(--lime)]">
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="最终名次" value={rankLabel(selected.finalRank)} />
                  <Metric label="最终成绩" value={selected.finalTimeText || formatDuration(selected.finalTimeMs)} />
                  <Metric label="净成绩" value={selected.netTimeText || formatDuration(selected.netTimeMs)} />
                  <Metric label="应用罚时" value={selected.appliedPenaltyText || formatDuration(selected.appliedPenaltyMs)} />
                </div>
                <div className="rounded border border-[var(--line)] p-3 text-sm">
                  <p className="font-bold">违例/复核</p>
                  <p className="mt-1 text-[var(--muted)]">{compactText(selected.note || selected.penaltyStatus, "无")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {(detail?.splits ?? []).map((split) => (
                    <div key={split.splitKey} className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm">
                      <span>{split.splitLabel}</span>
                      <strong>{split.splitTimeText || formatDuration(split.splitTimeMs)}</strong>
                    </div>
                  ))}
                </div>
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
    <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
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
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded border border-[var(--line)] bg-white px-3">
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
