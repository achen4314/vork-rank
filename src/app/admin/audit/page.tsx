"use client";

import { useEffect, useState } from "react";
import type { AuditLogEntry } from "@/lib/types";

const defaultEventSlug = "capital-college-fitness-2026";

export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?event=${defaultEventSlug}&page=${page}&limit=50`);
    const json = await res.json();
    setLogs(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <h1 className="text-xl font-black text-[var(--brand-navy)]">操作日志</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">共 {total} 条记录</p>

      <div className="mt-4 overflow-auto rounded border border-[var(--line)] bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">暂无日志</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-navy)] text-left text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold">时间</th>
                <th className="px-3 py-2.5 font-bold">操作</th>
                <th className="px-3 py-2.5 font-bold">表</th>
                <th className="px-3 py-2.5 font-bold">记录ID</th>
                <th className="px-3 py-2.5 font-bold">备注</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--line)] hover:bg-[var(--metric)]">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-bold text-[var(--brand-navy)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{log.tableName}</td>
                  <td className="px-3 py-2.5">{log.recordId ?? "-"}</td>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{log.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>共 {total} 条，第 {page}/{totalPages} 页</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-[var(--line)] bg-white px-3 py-1.5 font-bold 
                       text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)] 
                       disabled:opacity-40"
          >
            上一页
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-[var(--line)] bg-white px-3 py-1.5 font-bold 
                       text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)] 
                       disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
