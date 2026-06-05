"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import StartwaveForm, { type StartwaveFormState } from "@/components/StartwaveForm";
import StartwaveMessage from "@/components/StartwaveMessage";
import StartwaveResult from "@/components/StartwaveResult";
import type { StartwaveResponse } from "@/lib/types";

export default function StartwavePage() {
  const [result, setResult] = useState<StartwaveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = useCallback(async ({ name, phoneSuffix }: StartwaveFormState) => {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/startwave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneSuffix: phoneSuffix || undefined }),
      });
      const data = (await response.json()) as StartwaveResponse;

      if (!response.ok) {
        setErrorMessage(data.success ? `服务器错误 (${response.status})` : data.message);
        return;
      }

      setResult(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setErrorMessage("");
  }, []);

  const multiple = result && !result.success && "multiple" in result && result.multiple;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
      <header className="brand-shell border-b border-[var(--brand-navy)] bg-white">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-[640px] flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-14 shrink-0 place-items-center rounded-sm bg-[var(--brand-navy)] p-1.5">
              <Image src="/brand/vork-mark-lime.png" alt="VORK 图形标" width={358} height={188} priority sizes="56px" className="h-auto w-full" />
            </div>
            <div className="min-w-0">
              <Image src="/brand/vork-wordmark.png" alt="VORK" width={439} height={94} priority sizes="92px" className="h-4 w-auto" />
              <h1 className="mt-1 text-lg font-black text-[var(--brand-navy)]">报名查询</h1>
            </div>
          </div>
          <Link href="/" className="shrink-0 text-sm font-bold text-[var(--muted)] underline transition hover:text-[var(--brand-navy)]">
            返回排行榜
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-6">
        <section className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">VORK Startwave</p>
          <h2 className="mt-1 text-xl font-black text-[var(--brand-navy)]">首都高校体能竞速邀请赛</h2>
          <p className="mx-auto mt-2 max-w-[34rem] break-all text-sm leading-relaxed text-[var(--muted)]">
            输入姓名即可查询出发批次和具体出发时间；同名时再补充后四位。
          </p>
        </section>

        <section className="rounded border border-[var(--line)] bg-white p-5 shadow-sm">
          <StartwaveForm loading={loading} onSubmit={handleSearch} />
        </section>

        {errorMessage ? (
          <div className="mt-4">
            <StartwaveMessage type="error" message={errorMessage} onRetry={reset} />
          </div>
        ) : null}

        {result && !result.success ? (
          <div className="mt-4">
            <StartwaveMessage
              type={multiple ? "multiple" : "not-found"}
              message={result.message}
              candidateCount={multiple ? result.candidates.length : undefined}
            />
          </div>
        ) : null}

        {result?.success ? (
          <div className="mt-6">
            <StartwaveResult data={result} onReset={reset} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
