"use client";

import { useEffect, useState } from "react";
import type { DashboardStats } from "@/lib/types";

const defaultEventSlug = "capital-college-fitness-2026";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/stats?event=${defaultEventSlug}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <AdminLoading />;
  }

  return (
    <div>
      <h1 className="text-xl font-black text-[var(--brand-navy)]">仪表盘</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">首都高校体能竞速邀请赛</p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="总报名" value={stats?.totalRegistrations ?? 0} />
        <StatCard label="待审核" value={stats?.pending ?? 0} highlight />
        <StatCard label="已通过" value={stats?.approved ?? 0} />
        <StatCard label="已拒绝" value={stats?.rejected ?? 0} />
        <StatCard label="已分配波次" value={stats?.waveAssigned ?? 0} />
        <StatCard label="已签到" value={stats?.checkedIn ?? 0} />
      </div>

      {/* Project breakdown */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-[var(--line)] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-[var(--brand-navy)]">按项目统计</h2>
          {(stats?.byProject ?? []).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {(stats?.byProject ?? []).map((item) => (
                <div key={item.project} className="flex items-center justify-between text-sm">
                  <span>{item.project}</span>
                  <span className="font-bold text-[var(--brand-navy)]">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-[var(--line)] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-[var(--brand-navy)]">波次容量</h2>
          {(stats?.waveUtilization ?? []).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">暂无波次</p>
          ) : (
            <div className="space-y-3">
              {(stats?.waveUtilization ?? []).map((wave) => (
                <div key={wave.waveLabel}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{wave.waveLabel}</span>
                    <span className="text-[var(--muted)]">
                      {wave.enrolled}/{wave.capacity}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--brand-navy)] transition-all"
                      style={{
                        width: `${Math.min(100, (wave.enrolled / wave.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded border px-3 py-3 shadow-sm ${
        highlight
          ? "border-[var(--brand-navy)] bg-[var(--brand-soft)]"
          : "border-[var(--line)] bg-white"
      }`}
    >
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function AdminLoading() {
  return (
    <div>
      <div className="h-6 w-32 animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-1 h-4 w-48 animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded border border-[var(--line)] bg-white px-3 py-3 shadow-sm">
            <div className="h-3 w-14 animate-pulse rounded bg-[var(--line)]" />
            <div className="mt-2 h-6 w-12 animate-pulse rounded bg-[var(--line)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
