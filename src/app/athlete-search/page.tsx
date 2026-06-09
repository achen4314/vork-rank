"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, SearchIcon } from "@/components/Icons";

export default function AthleteSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { bib: string; name: string; divisionCode: string; divisionName: string; school: string; project: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/results?event=capital-college-fitness-2026&q=${encodeURIComponent(q)}&limit=20`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
      <header className="brand-shell border-b border-[var(--brand-navy)] bg-white">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-[720px] items-center gap-4 px-4 py-4">
          <Link href="/" className="text-[var(--brand-navy)] transition hover:opacity-70">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-black text-[var(--brand-navy)]">运动员信息查询</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-4 py-6">
        {/* Search bar */}
        <section className="rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="输入姓名、号码或学校搜索运动员"
                className="h-11 w-full rounded border border-[var(--line)] bg-white pl-9 pr-3 text-[var(--ink)]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded border-2 
                         border-[var(--brand-navy)] bg-[var(--brand-navy)] px-5 text-sm font-bold 
                         text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>
        </section>

        {/* Results */}
        {loading && (
          <div className="mt-6 text-center text-sm text-[var(--muted)]">搜索中...</div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="mt-6 rounded border border-[var(--line)] bg-white p-8 text-center shadow-sm">
            <p className="text-[var(--muted)]">未找到匹配的运动员</p>
            <p className="mt-1 text-xs text-[var(--muted)]">请尝试其他关键词</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <section className="mt-6">
            <p className="mb-3 text-sm text-[var(--muted)]">
              找到 {results.length} 条结果
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((athlete) => (
                <button
                  key={`${athlete.divisionCode}-${athlete.bib}`}
                  onClick={() =>
                    router.push(
                      `/results/${encodeURIComponent(athlete.divisionCode)}/${encodeURIComponent(athlete.bib)}`
                    )
                  }
                  className="rounded border border-[var(--line)] bg-white p-4 text-left shadow-sm 
                             transition hover:border-[var(--brand-navy)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--brand-navy)]">{athlete.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        号码 {athlete.bib} · {athlete.project}
                      </p>
                    </div>
                    <span className="shrink-0 rounded border border-[var(--line)] px-2 py-0.5 text-xs 
                                     font-bold text-[var(--brand-navy)]">
                      {athlete.divisionName}
                    </span>
                  </div>
                  {athlete.school && (
                    <p className="mt-2 text-xs text-[var(--muted)]">{athlete.school}</p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
