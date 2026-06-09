"use client";

import { useState, useCallback } from "react";
import type { RegistrationEntry } from "@/lib/types";
import { ArrowLeftIcon, MailIcon, SendIcon, ShieldIcon } from "@/components/Icons";

const defaultEventSlug = "capital-college-fitness-2026";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "text-yellow-600" },
  reviewed: { label: "已审核", color: "text-blue-600" },
  approved: { label: "已通过", color: "text-green-600" },
  rejected: { label: "已拒绝", color: "text-red-600" },
  bib_assigned: { label: "已分配号码", color: "text-blue-600" },
  wave_assigned: { label: "已分配波次", color: "text-blue-600" },
  confirmed: { label: "已确认", color: "text-green-600" },
  checked_in: { label: "已签到", color: "text-green-600" },
  racing: { label: "比赛中", color: "text-[var(--brand-navy)]" },
  finished: { label: "已完赛", color: "text-[var(--brand-navy)]" },
  cancelled: { label: "已取消", color: "text-gray-400" },
};

export default function RegisterStatusPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "result">("email");
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = useCallback(async () => {
    if (!email) {
      setError("请输入邮箱地址");
      return;
    }
    setSendingCode(true);
    setError("");
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "status_check" }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("code");
      } else {
        setError(data.message);
      }
    } catch {
      setError("验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  }, [email]);

  const handleVerify = useCallback(async () => {
    if (!code) {
      setError("请输入验证码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          purpose: "status_check",
          eventSlug: defaultEventSlug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations ?? []);
        setStep("result");
      } else {
        setError(data.message);
      }
    } catch {
      setError("验证失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }, [email, code]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
      <header className="brand-shell border-b border-[var(--brand-navy)] bg-white">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-[580px] items-center gap-4 px-4 py-4">
          <a href="/" className="text-[var(--brand-navy)] transition hover:opacity-70" title="返回首页">
            <ArrowLeftIcon className="h-5 w-5" />
          </a>
          <h1 className="text-lg font-black text-[var(--brand-navy)]">报名状态查询</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[580px] px-4 py-6">
        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-[var(--red)]">{error}</p>
          </div>
        )}

        {step === "email" && (
          <section className="rounded border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)]">
              <MailIcon className="h-8 w-8 text-[var(--brand-navy)]" />
            </div>
            <h2 className="text-center text-lg font-bold text-[var(--brand-navy)]">
              查询报名状态
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--muted)]">
              输入报名时使用的邮箱，我们将发送验证码。
            </p>
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
                placeholder="请输入报名邮箱"
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              />
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded 
                         border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 font-bold 
                         text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <SendIcon className="h-4 w-4" />
              {sendingCode ? "发送中..." : "发送验证码"}
            </button>
          </section>
        )}

        {step === "code" && (
          <section className="rounded border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)]">
              <ShieldIcon className="h-8 w-8 text-[var(--brand-navy)]" />
            </div>
            <h2 className="text-center text-lg font-bold text-[var(--brand-navy)]">
              输入验证码
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--muted)]">
              验证码已发送至 {email}
            </p>
            <div className="mt-6">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 w-full rounded border border-[var(--line)] px-3 text-center text-xl 
                           tracking-[0.5em] text-[var(--ink)]"
                placeholder="000000"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || code.length < 6}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded 
                         border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 font-bold 
                         text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "验证中..." : "确认验证码"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded border 
                         border-[var(--line)] bg-white px-6 font-bold text-[var(--brand-navy)] 
                         transition hover:border-[var(--brand-navy)]"
            >
              重新输入邮箱
            </button>
          </section>
        )}

        {step === "result" && (
          <section>
            {registrations.length === 0 ? (
              <div className="rounded border border-[var(--line)] bg-white p-6 text-center shadow-sm">
                <p className="text-[var(--muted)]">未找到报名记录</p>
                <a
                  href="/register"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded border-2 
                             border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 font-bold 
                             text-white transition hover:opacity-90"
                >
                  立即报名
                </a>
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-bold text-[var(--brand-navy)]">
                  您的报名记录
                </h2>
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="mb-3 rounded border border-[var(--line)] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-[var(--brand-navy)]">
                          {reg.name} · {reg.project}
                        </p>
                        {reg.teamName && (
                          <p className="text-sm text-[var(--muted)]">队名：{reg.teamName}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded border border-[var(--line)] px-2 py-1 text-xs font-bold ${
                          STATUS_LABELS[reg.status]?.color ?? "text-[var(--muted)]"
                        }`}
                      >
                        {STATUS_LABELS[reg.status]?.label ?? reg.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                      {reg.bib && (
                        <div className="rounded bg-[var(--metric)] px-2 py-1">
                          <span className="block">号码</span>
                          <strong className="text-[var(--brand-navy)]">{reg.bib}</strong>
                        </div>
                      )}
                      {reg.divisionCode && (
                        <div className="rounded bg-[var(--metric)] px-2 py-1">
                          <span className="block">分组</span>
                          <strong className="text-[var(--brand-navy)]">{reg.divisionCode}</strong>
                        </div>
                      )}
                      {reg.waveLabel && reg.startTime && (
                        <div className="rounded bg-[var(--metric)] px-2 py-1 col-span-2">
                          <span className="block">出发时间</span>
                          <strong className="text-[var(--brand-navy)]">
                            {reg.waveLabel} · {new Date(reg.startTime).toLocaleString("zh-CN", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </strong>
                        </div>
                      )}
                    </div>
                    {reg.statusNote && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        备注：{reg.statusNote}
                      </p>
                    )}
                  </div>
                ))}
                <div className="mt-6 text-center">
                  <a
                    href="/register"
                    className="inline-flex h-11 items-center justify-center rounded border 
                               border-[var(--line)] bg-white px-6 font-bold text-[var(--brand-navy)] 
                               transition hover:border-[var(--brand-navy)]"
                  >
                    再次报名
                  </a>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

