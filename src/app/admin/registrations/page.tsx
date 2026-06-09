"use client";

import { useEffect, useState, useCallback } from "react";
import type { RegistrationEntry } from "@/lib/types";

const defaultEventSlug = "capital-college-fitness-2026";

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "reviewed", label: "已审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "bib_assigned", label: "已分配号码" },
  { value: "wave_assigned", label: "已分配波次" },
  { value: "confirmed", label: "已确认" },
  { value: "checked_in", label: "已签到" },
  { value: "finished", label: "已完赛" },
  { value: "cancelled", label: "已取消" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  reviewed: "已审核",
  approved: "已通过",
  rejected: "已拒绝",
  bib_assigned: "号码已分配",
  wave_assigned: "波次已分配",
  confirmed: "已确认",
  checked_in: "已签到",
  racing: "比赛中",
  finished: "已完赛",
  cancelled: "已取消",
};

export const dynamic = "force-dynamic";

export default function AdminRegistrationsPage() {
  const [data, setData] = useState<RegistrationEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<RegistrationEntry | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      event: defaultEventSlug,
      page: String(page),
      limit: "50",
    });
    if (status) params.set("status", status);
    if (search) params.set("q", search);

    const res = await fetch(`/api/admin/registrations?${params}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load detail
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const reg = data.find((r) => r.id === selectedId);
    setSelected(reg ?? null);
  }, [selectedId, data]);

  const handleAction = async (action: string, id: number, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    const updates: Record<string, unknown> = { ...extra };
    const noteMap: Record<string, string> = {
      approve: "审核通过",
      reject: reviewNote || "不符合报名条件",
      bib: "分配号码",
      wave: "分配波次",
      confirm: "确认参赛",
      checkin: "现场签到",
      cancel: "取消报名",
    };

    switch (action) {
      case "approve":
        updates.status = "approved";
        break;
      case "reject":
        updates.status = "rejected";
        updates.status_note = reviewNote || "不符合报名条件";
        break;
      default:
        break;
    }

    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates, note: noteMap[action] }),
    });

    setActionLoading(false);
    setReviewNote("");
    setSelectedId(null);
    fetchData();
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <h1 className="text-xl font-black text-[var(--brand-navy)]">报名管理</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">共 {total} 条报名记录</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-10 w-full rounded border border-[var(--line)] bg-white px-3 text-sm 
                     text-[var(--ink)] sm:w-64"
          placeholder="搜索姓名/手机/邮箱..."
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 rounded border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
          className="h-10 rounded border border-[var(--line)] bg-white px-3 text-sm 
                     font-bold text-[var(--muted)] transition hover:border-[var(--brand-navy)]"
        >
          重置
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-auto rounded border border-[var(--line)] bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">加载中...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">暂无数据</div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[var(--brand-navy)] text-left text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold">ID</th>
                <th className="px-3 py-2.5 font-bold">姓名</th>
                <th className="px-3 py-2.5 font-bold">手机号</th>
                <th className="px-3 py-2.5 font-bold">项目</th>
                <th className="px-3 py-2.5 font-bold">号码</th>
                <th className="px-3 py-2.5 font-bold">波次</th>
                <th className="px-3 py-2.5 font-bold">状态</th>
                <th className="px-3 py-2.5 font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((reg) => (
                <tr key={reg.id} className="border-b border-[var(--line)] hover:bg-[var(--metric)]">
                  <td className="px-3 py-2.5">{reg.id}</td>
                  <td className="px-3 py-2.5 font-bold">{reg.name}</td>
                  <td className="px-3 py-2.5">{reg.phone}</td>
                  <td className="px-3 py-2.5">{reg.project}</td>
                  <td className="px-3 py-2.5">{reg.bib ?? "-"}</td>
                  <td className="px-3 py-2.5">{reg.waveLabel ?? "-"}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-bold text-[var(--brand-navy)]">
                      {STATUS_LABELS[reg.status] ?? reg.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => setSelectedId(reg.id)}
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs font-bold 
                                 text-[var(--muted)] transition hover:border-[var(--brand-navy)] 
                                 hover:text-[var(--brand-navy)]"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Detail Panel */}
      {selected && (
        <div className="mt-6 rounded border border-[var(--brand-navy)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black text-[var(--brand-navy)]">
                {selected.name} · {selected.project}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                报名 #{selected.id} · {selected.email} · {selected.phone}
              </p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              关闭
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded bg-[var(--metric)] px-3 py-2">
              <span className="block text-[var(--muted)]">性别</span>
              <strong>{selected.gender}</strong>
            </div>
            <div className="rounded bg-[var(--metric)] px-3 py-2">
              <span className="block text-[var(--muted)]">学校/单位</span>
              <strong>{selected.organization ?? "-"}</strong>
            </div>
            <div className="rounded bg-[var(--metric)] px-3 py-2">
              <span className="block text-[var(--muted)]">号码</span>
              <strong>{selected.bib ?? "未分配"}</strong>
            </div>
            <div className="rounded bg-[var(--metric)] px-3 py-2">
              <span className="block text-[var(--muted)]">波次/出发时间</span>
              <strong>
                {selected.waveLabel ? `${selected.waveLabel} · ${selected.startTime ? new Date(selected.startTime).toLocaleString("zh-CN") : "-"}` : "未分配"}
              </strong>
            </div>
          </div>

          {selected.teamName && selected.teammates && (
            <div className="mt-4 rounded border border-[var(--line)] p-3">
              <p className="mb-2 text-sm font-bold text-[var(--brand-navy)]">
                队名：{selected.teamName}
              </p>
              {(selected.teammates as { name: string; gender: string; phone: string }[]).map((m, i) => (
                <p key={i} className="text-xs text-[var(--muted)]">
                  队友{i + 1}：{m.name} ({m.gender}) {m.phone}
                </p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <p className="mb-3 text-sm font-bold text-[var(--brand-navy)]">操作</p>
            <div className="flex flex-wrap gap-2">
              {selected.status === "pending" && (
                <>
                  <ActionBtn
                    label="审核通过"
                    onClick={() => handleAction("approve", selected.id)}
                    loading={actionLoading}
                    primary
                  />
                  <input
                    type="text"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="拒绝理由"
                    className="h-9 rounded border border-[var(--line)] px-2 text-xs"
                  />
                  <ActionBtn
                    label="拒绝"
                    onClick={() => handleAction("reject", selected.id)}
                    loading={actionLoading}
                    danger
                  />
                </>
              )}
              {(selected.status === "approved" || selected.status === "bib_assigned" || selected.status === "wave_assigned") && (
                <>
                  {selected.status !== "wave_assigned" && selected.status !== "bib_assigned" && (
                    <ActionBtn
                      label="确认参赛"
                      onClick={() => handleAction("confirm", selected.id, { status: "confirmed" })}
                      loading={actionLoading}
                      primary
                    />
                  )}
                  <ActionBtn
                    label="取消报名"
                    onClick={() => handleAction("cancel", selected.id, { status: "cancelled" })}
                    loading={actionLoading}
                    danger
                  />
                </>
              )}
              {(selected.status === "confirmed" || selected.status === "wave_assigned" || selected.status === "bib_assigned") && (
                <ActionBtn
                  label="现场签到"
                  onClick={() => handleAction("checkin", selected.id, { status: "checked_in" })}
                  loading={actionLoading}
                  primary
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  loading,
  primary,
  danger,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
        danger
          ? "border-[var(--red)] text-[var(--red)] hover:bg-red-50"
          : primary
            ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white hover:opacity-90"
            : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
