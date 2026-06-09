"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ShieldIcon } from "@/components/Icons";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"password" | "code">("password");
  const [step, setStep] = useState<"form" | "code">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Password login
  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message ?? "登录失败");
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: admin } = await supabase
      .from("admins")
      .select("role, event_slug")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setError("您不是管理员");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  // Send verification code
  const sendCode = async () => {
    if (!email) {
      setError("请输入管理员邮箱");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setStep("code");
    }
    setLoading(false);
  };

  // Verify code
  const verifyCode = async () => {
    if (!code) {
      setError("请输入验证码");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError || !data.user) {
      setError("验证失败");
      setLoading(false);
      return;
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("role, event_slug")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setError("您不是管理员");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] rounded border border-[var(--line)] bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)]">
            <ShieldIcon className="h-8 w-8 text-[var(--brand-navy)]" />
          </div>
          <h1 className="text-xl font-black text-[var(--brand-navy)]">管理员登录</h1>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex rounded border border-[var(--line)] bg-[var(--metric)] p-1">
          <button
            onClick={() => { setMode("password"); setStep("form"); setError(""); }}
            className={`flex-1 rounded py-1.5 text-sm font-bold transition ${
              mode === "password"
                ? "bg-white text-[var(--brand-navy)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            密码登录
          </button>
          <button
            onClick={() => { setMode("code"); setStep("form"); setError(""); }}
            className={`flex-1 rounded py-1.5 text-sm font-bold transition ${
              mode === "code"
                ? "bg-white text-[var(--brand-navy)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            验证码登录
          </button>
        </div>

        {mode === "password" ? (
          <>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="admin@example.com"
            />
            <label className="mb-2 mt-4 block text-sm font-medium text-[var(--ink)]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="请输入密码"
              onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
            />
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={loading}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded 
                         border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 
                         font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </>
        ) : step === "form" ? (
          <>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded border border-[var(--line)] px-3 text-[var(--ink)]"
              placeholder="admin@example.com"
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loading}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded 
                         border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 
                         font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "发送中..." : "发送登录验证码"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-6">
              验证码已发送至 <strong>{email}</strong>
            </p>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">邮箱验证码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 w-full rounded border border-[var(--line)] px-3 text-center 
                         text-xl tracking-[0.5em] text-[var(--ink)]"
              placeholder="000000"
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.length < 6}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded 
                         border-2 border-[var(--brand-navy)] bg-[var(--brand-navy)] px-6 
                         font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "验证中..." : "登录"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("form"); setCode(""); }}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded border 
                         border-[var(--line)] bg-white px-6 font-bold text-[var(--brand-navy)] 
                         transition hover:border-[var(--brand-navy)]"
            >
              重新发送
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-[var(--red)]">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
