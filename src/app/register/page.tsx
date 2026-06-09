"use client";

import { useState, useCallback } from "react";
import { validateRegistrationForm } from "@/lib/registration/validate";
import type { RegistrationFormData, RegistrationTeamMember } from "@/lib/types";
import { ArrowLeftIcon, SendIcon } from "@/components/Icons";

const defaultEventSlug = "capital-college-fitness-2026";

const PROJECTS = [
  { value: "", label: "请选择项目" },
  { value: "单项测试", label: "单项测试" },
  { value: "男子单人", label: "男子单人" },
  { value: "女子单人", label: "女子单人" },
  { value: "男子双人", label: "男子双人" },
  { value: "女子双人", label: "女子双人" },
  { value: "混合4人", label: "混合4人" },
];

const DIVISIONS = [
  { value: "", label: "请选择意向组别" },
  { value: "甲A", label: "甲A组 青春组" },
  { value: "甲B", label: "甲B组 雄鹰组" },
  { value: "甲C", label: "甲C组 班级组" },
  { value: "丙A", label: "丙A组 高校组" },
  { value: "丙B", label: "丙B组 邀请组" },
  { value: "乙", label: "乙组 教工校友组" },
];

const TEAM_PROJECTS = ["男子双人", "女子双人", "混合4人"];
const TEAM_SIZE_LABEL: Record<string, string> = {
  "男子双人": "队友（共1人）",
  "女子双人": "队友（共1人）",
  "混合4人": "队友（共3人）",
};

function newMember(): RegistrationTeamMember {
  return { name: "", gender: "", phone: "" };
}

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({
    name: "",
    gender: "",
    idCard: "",
    phone: "",
    email: "",
    birthDate: "",
    nationality: "中国",
    organization: "",
    emergencyName: "",
    emergencyPhone: "",
    project: "",
    divisionHint: "",
    teamName: "",
    teammates: [] as RegistrationTeamMember[],
    healthOk: false,
    waiverOk: false,
    medicalNote: "",
    verificationCode: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  const update = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isTeamProject = TEAM_PROJECTS.includes(form.project);

  const handleSendCode = useCallback(async () => {
    if (!form.email) {
      setErrors(["请先填写邮箱地址"]);
      return;
    }
    setSendingCode(true);
    setErrors([]);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, purpose: "register" }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
      } else {
        setErrors([data.message]);
      }
    } catch {
      setErrors(["验证码发送失败"]);
    } finally {
      setSendingCode(false);
    }
  }, [form.email]);

  const handleSubmit = useCallback(async () => {
    setErrors([]);

    const validationErrors = validateRegistrationForm(
      form as Partial<RegistrationFormData>,
    );
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventSlug: defaultEventSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationId(data.registrationId);
        setStep("success");
      } else {
        setErrors([data.message]);
      }
    } catch {
      setErrors(["提交失败，请检查网络"]);
    } finally {
      setLoading(false);
    }
  }, [form]);

  if (step === "success") {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto max-w-[480px] px-4 py-12 text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[var(--brand-soft)]">
            <svg
              className="h-10 w-10 text-[var(--brand-navy)]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[var(--brand-navy)]">报名成功！</h1>
          <p className="mt-3 text-[var(--muted)]">
            您的报名已提交，请等待管理员审核。
          </p>
          {registrationId && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              报名编号：{registrationId}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <a
              href="/register/status"
              className="inline-flex h-11 items-center justify-center rounded border-2 border-[var(--brand-navy)] 
                         bg-[var(--brand-navy)] px-6 font-bold text-white transition hover:opacity-90"
            >
              查看报名状态
            </a>
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded border border-[var(--line)] 
                         bg-white px-6 font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)]"
            >
              返回排行榜
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
      <header className="brand-shell border-b border-[var(--brand-navy)] bg-white">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-[720px] items-center gap-4 px-4 py-4">
          <a href="/" className="text-[var(--brand-navy)] transition hover:opacity-70" title="返回首页">
            <ArrowLeftIcon className="h-5 w-5" />
          </a>
          <h1 className="text-lg font-black text-[var(--brand-navy)]">赛事报名</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-4 py-6">
        {errors.length > 0 && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-4">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-[var(--red)]">{err}</p>
            ))}
          </div>
        )}

        <section className="rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-[var(--brand-navy)]">个人信息</h2>

          {/* Name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">姓名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="请输入真实姓名"
            />
          </div>

          {/* Gender + Phone */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">性别 *</label>
              <select
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
              >
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">手机号 *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
                placeholder="11位手机号"
                maxLength={11}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">邮箱 *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="h-11 flex-1 rounded border border-[var(--line)] px-3 text-[var(--ink)]"
                placeholder="用于接收验证码和通知"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded border border-[var(--brand-navy)] 
                           px-4 font-bold text-[var(--brand-navy)] transition hover:bg-[var(--brand-soft)] 
                           disabled:opacity-50"
              >
                <SendIcon className="h-4 w-4" />
                {codeSent ? "重新发送" : sendingCode ? "发送中..." : "发送验证码"}
              </button>
            </div>
          </div>

          {/* Verification Code */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">邮箱验证码 *</label>
            <input
              type="text"
              value={form.verificationCode}
              onChange={(e) => update("verificationCode", e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="输入6位验证码"
              maxLength={6}
            />
          </div>

          {/* Birth Date + ID Card */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">出生日期</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">证件号</label>
              <input
                type="text"
                value={form.idCard}
                onChange={(e) => update("idCard", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
                placeholder="身份证/护照号"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">学校/单位</label>
            <input
              type="text"
              value={form.organization}
              onChange={(e) => update("organization", e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="如：北京大学"
            />
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="mt-4 rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--brand-navy)]">紧急联系人</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">紧急联系人姓名</label>
              <input
                type="text"
                value={form.emergencyName}
                onChange={(e) => update("emergencyName", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">紧急联系电话</label>
              <input
                type="tel"
                value={form.emergencyPhone}
                onChange={(e) => update("emergencyPhone", e.target.value)}
                className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              />
            </div>
          </div>
        </section>

        {/* Project Selection */}
        <section className="mt-4 rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--brand-navy)]">参赛项目</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">项目 *</label>
            <select
              value={form.project}
              onChange={(e) => update("project", e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
            >
              {PROJECTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">意向组别</label>
            <select
              value={form.divisionHint}
              onChange={(e) => update("divisionHint", e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
            >
              {DIVISIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team section */}
          {isTeamProject && (
            <div className="rounded border border-[var(--line)] bg-[var(--metric)] p-4">
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">队名 *</label>
                <input
                  type="text"
                  value={form.teamName}
                  onChange={(e) => update("teamName", e.target.value)}
                  className="h-11 w-full rounded border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
                  placeholder="请输入队伍名称"
                />
              </div>
              <p className="mb-3 text-sm font-medium text-[var(--muted)]">
                {TEAM_SIZE_LABEL[form.project] || "队友信息"}
              </p>
              {form.teammates.map((member, index) => (
                <div key={index} className="mb-3 rounded border border-[var(--line)] bg-white p-3">
                  <p className="mb-2 text-xs font-bold text-[var(--brand-navy)]">队友 {index + 1}</p>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...form.teammates];
                        updated[index] = { ...updated[index], name: e.target.value };
                        update("teammates", updated);
                      }}
                      className="h-10 w-full rounded border border-[var(--line)] px-3 text-sm text-[var(--ink)]"
                      placeholder="姓名"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={member.gender}
                      onChange={(e) => {
                        const updated = [...form.teammates];
                        updated[index] = { ...updated[index], gender: e.target.value };
                        update("teammates", updated);
                      }}
                      className="h-10 rounded border border-[var(--line)] bg-white px-2 text-sm text-[var(--ink)]"
                    >
                      <option value="">性别</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => {
                        const updated = [...form.teammates];
                        updated[index] = { ...updated[index], phone: e.target.value };
                        update("teammates", updated);
                      }}
                      className="h-10 rounded border border-[var(--line)] px-2 text-sm text-[var(--ink)]"
                      placeholder="手机号"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update("teammates", [...form.teammates, newMember()])}
                  className="h-9 rounded border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] 
                             transition hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]"
                >
                  + 添加队友
                </button>
                {form.teammates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => update("teammates", form.teammates.slice(0, -1))}
                    className="h-9 rounded border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] 
                               transition hover:border-[var(--red)] hover:text-[var(--red)]"
                  >
                    移除最后一位
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Health + Waiver */}
        <section className="mt-4 rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[var(--brand-navy)]">健康声明</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.healthOk}
                onChange={(e) => update("healthOk", e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[var(--brand-navy)]"
              />
              <span className="text-sm text-[var(--muted)]">
                我确认本人身体健康，无心脏病、高血压等不适宜剧烈运动的疾病，适合参加本赛事。
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.waiverOk}
                onChange={(e) => update("waiverOk", e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[var(--brand-navy)]"
              />
              <span className="text-sm text-[var(--muted)]">
                我已阅读并同意
                <a href="#" className="font-bold text-[var(--brand-navy)] underline">
                  参赛免责声明
                </a>
                ，了解赛事风险并自愿承担。
              </span>
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                特殊情况说明（选填）
              </label>
              <textarea
                value={form.medicalNote}
                onChange={(e) => update("medicalNote", e.target.value)}
                className="h-20 w-full rounded border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                placeholder="如有过敏史、旧伤等请在此说明"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded border-2 border-[var(--brand-navy)] 
                       bg-[var(--brand-navy)] px-8 text-base font-black text-white transition 
                       hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "提交中..." : "提交报名"}
          </button>
        </div>
      </div>
    </main>
  );
}
