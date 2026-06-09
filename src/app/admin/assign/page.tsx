"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/components/Icons";

const defaultEventSlug = "capital-college-fitness-2026";

export const dynamic = "force-dynamic";

export default function AdminAssignPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; assigned: number } | null>(null);

  const handleAssign = async (type: "waves" | "bibs") => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, eventSlug: defaultEventSlug }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "请求失败", assigned: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-black text-[var(--brand-navy)]">一键分配</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        自动为已通过审核的报名分配波次和号码
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Wave assignment */}
        <div className="rounded border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--brand-soft)]">
            <CheckCircleIcon className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <h2 className="text-center text-sm font-bold text-[var(--brand-navy)]">
            分配波次
          </h2>
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            按项目分组，依序分配到各波次，
            <br />
            每波不超过容量上限。
          </p>
          <p className="mt-3 rounded bg-[var(--metric)] px-3 py-2 text-xs text-[var(--muted)]">
            分配顺序：先到先得，按报名时间排序
          </p>
          <button
            onClick={() => handleAssign("waves")}
            disabled={loading}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded border-2 
                       border-[var(--brand-navy)] bg-[var(--brand-navy)] px-4 text-sm font-bold 
                       text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "分配中..." : "自动分配波次"}
          </button>
        </div>

        {/* Bib assignment */}
        <div className="rounded border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--brand-soft)]">
            <CheckCircleIcon className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <h2 className="text-center text-sm font-bold text-[var(--brand-navy)]">
            分配号码
          </h2>
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            自动生成唯一参赛号码，
            <br />
            格式：项目代号 + 序号。
          </p>
          <div className="mt-3 rounded bg-[var(--metric)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
            单项测试: 1xxx · 单人: 1xxx<br />
            男子双人: 15xx · 女子双人: 16xx<br />
            混合4人: 17xx
          </div>
          <button
            onClick={() => handleAssign("bibs")}
            disabled={loading}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded border-2 
                       border-[var(--brand-navy)] bg-[var(--brand-navy)] px-4 text-sm font-bold 
                       text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "分配中..." : "自动分配号码"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mt-6 rounded border p-4 shadow-sm ${
            result.success
              ? "border-green-300 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className={`text-sm font-bold ${result.success ? "text-green-700" : "text-[var(--red)]"}`}>
            {result.message}
          </p>
          {result.success && result.assigned > 0 && (
            <p className="mt-1 text-sm text-green-600">成功分配 {result.assigned} 条记录</p>
          )}
        </div>
      )}
    </div>
  );
}
