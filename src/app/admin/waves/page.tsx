"use client";

import { useEffect, useState } from "react";
import type { WaveEntry } from "@/lib/types";

const defaultEventSlug = "capital-college-fitness-2026";

export const dynamic = "force-dynamic";

export default function AdminWavesPage() {
  const [waves, setWaves] = useState<WaveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    waveLabel: "",
    startTime: "",
    intervalMin: 3,
    capacity: 20,
  });
  const [saving, setSaving] = useState(false);

  const fetchWaves = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/waves?event=${defaultEventSlug}`);
    const json = await res.json();
    setWaves(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWaves();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const startTime = new Date(form.startTime).toISOString();
    await fetch("/api/admin/waves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventSlug: defaultEventSlug, ...form, startTime }),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ waveLabel: "", startTime: "", intervalMin: 3, capacity: 20 });
    fetchWaves();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此波次？")) return;
    await fetch(`/api/admin/waves?id=${id}`, { method: "DELETE" });
    fetchWaves();
  };

  const handleEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const startTime = form.startTime
      ? new Date(form.startTime).toISOString()
      : undefined;
    await fetch("/api/admin/waves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        ...(form.waveLabel && { wave_label: form.waveLabel }),
        ...(startTime && { start_time: startTime }),
        ...(form.capacity && { capacity: form.capacity }),
      }),
    });
    setSaving(false);
    setEditId(null);
    setForm({ waveLabel: "", startTime: "", intervalMin: 3, capacity: 20 });
    fetchWaves();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[var(--brand-navy)]">波次管理</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">共 {waves.length} 个波次</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setEditId(null);
            setForm({ waveLabel: "", startTime: "", intervalMin: 3, capacity: 20 });
          }}
          className="rounded border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-4 py-2 
                     text-sm font-bold text-white transition hover:opacity-90"
        >
          创建波次
        </button>
      </div>

      {/* Create/Edit form */}
      {(showCreate || editId) && (
        <div className="mt-4 rounded border border-[var(--brand-navy)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-[var(--brand-navy)]">
            {editId ? "编辑波次" : "创建新波次"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink)]">波次标签</label>
              <input
                type="text"
                value={form.waveLabel}
                onChange={(e) => setForm({ ...form, waveLabel: e.target.value })}
                placeholder="如：第1波"
                className="h-10 w-full rounded border border-[var(--line)] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink)]">出发时间</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="h-10 w-full rounded border border-[var(--line)] bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink)]">间隔(分)</label>
              <input
                type="number"
                value={form.intervalMin}
                onChange={(e) => setForm({ ...form, intervalMin: parseInt(e.target.value) || 3 })}
                className="h-10 w-full rounded border border-[var(--line)] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink)]">容量(人)</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 20 })}
                className="h-10 w-full rounded border border-[var(--line)] px-3 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={editId ? handleEdit : handleCreate}
              disabled={saving}
              className="rounded border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-4 
                         py-1.5 text-xs font-bold text-white transition hover:opacity-90 
                         disabled:opacity-50"
            >
              {saving ? "保存中..." : editId ? "保存修改" : "创建"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setEditId(null); }}
              className="rounded border border-[var(--line)] bg-white px-4 py-1.5 text-xs 
                         font-bold text-[var(--muted)] transition hover:border-[var(--brand-navy)]"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-4 overflow-auto rounded border border-[var(--line)] bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">加载中...</div>
        ) : waves.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted)]">暂无波次，请创建</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-navy)] text-left text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold">波次</th>
                <th className="px-3 py-2.5 font-bold">出发时间</th>
                <th className="px-3 py-2.5 font-bold">间隔</th>
                <th className="px-3 py-2.5 font-bold">容量</th>
                <th className="px-3 py-2.5 font-bold">已分配</th>
                <th className="px-3 py-2.5 font-bold">利用率</th>
                <th className="px-3 py-2.5 font-bold">状态</th>
                <th className="px-3 py-2.5 font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {waves.map((wave) => (
                <tr key={wave.id} className="border-b border-[var(--line)] hover:bg-[var(--metric)]">
                  <td className="px-3 py-2.5 font-bold">{wave.waveLabel}</td>
                  <td className="px-3 py-2.5">
                    {new Date(wave.startTime).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-3 py-2.5">{wave.intervalMin} 分钟</td>
                  <td className="px-3 py-2.5">{wave.capacity}</td>
                  <td className="px-3 py-2.5">{wave.enrolledCount}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-[var(--line)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--brand-navy)]"
                          style={{
                            width: `${Math.min(100, (wave.enrolledCount / wave.capacity) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {Math.round((wave.enrolledCount / wave.capacity) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                      wave.status === "open"
                        ? "bg-green-50 text-green-700"
                        : wave.status === "full"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-[var(--muted)]"
                    }`}>
                      {wave.status === "open" ? "开放" : wave.status === "full" ? "已满" : wave.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditId(wave.id);
                          setShowCreate(false);
                          setForm({
                            waveLabel: wave.waveLabel,
                            startTime: wave.startTime.slice(0, 16),
                            intervalMin: wave.intervalMin,
                            capacity: wave.capacity,
                          });
                        }}
                        className="rounded border border-[var(--line)] px-2 py-1 text-xs 
                                   text-[var(--muted)] hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(wave.id)}
                        className="rounded border border-[var(--line)] px-2 py-1 text-xs 
                                   text-[var(--red)] hover:border-[var(--red)]"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
