"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ShieldIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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

  const verifyCode = async () => {
    if (!code) {
      setError("请输入邮箱中的验证码");
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
      setError("验证失败，请检查验证码是否正确");
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
      setError("您不是管理员，无权访问后台");
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
          <p className="mt-2 text-sm text-[var(--muted)]">Vork Rank 管理后台</p>
        </div>

        {step === "email" ? (
          <>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">管理员邮箱</label>
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
              onClick={() => { setStep("email"); setCode(""); }}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded border 
                         border-[var(--line)] bg-white px-6 font-bold text-[var(--brand-navy)] 
                         transition hover:border-[var(--brand-navy)]"
            >
              重新输入邮箱
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
