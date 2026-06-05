"use client";

import { type FormEvent, useCallback, useState } from "react";
import { LoaderIcon, SearchIcon } from "@/components/Icons";

export type StartwaveFormState = {
  name: string;
  phoneSuffix: string;
};

type StartwaveFormProps = {
  loading: boolean;
  onSubmit: (state: StartwaveFormState) => void;
};

export default function StartwaveForm({ loading, onSubmit }: StartwaveFormProps) {
  const [name, setName] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName || loading) return;
      onSubmit({ name: trimmedName, phoneSuffix: phoneSuffix.trim() });
    },
    [loading, name, onSubmit, phoneSuffix],
  );

  const canSubmit = name.trim().length > 0 && !loading;

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
      <p className="min-w-0 break-all text-sm leading-relaxed text-[var(--muted)]">输入姓名查询出发批次；同名时补充报名手机号或证件号码后四位。</p>

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-bold text-[var(--brand-navy)]">姓名</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="请输入姓名"
          autoFocus
          autoComplete="name"
          className="h-12 w-full min-w-0 rounded border border-[var(--line)] bg-white px-4 text-base text-[var(--ink)] transition placeholder:text-[var(--muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-lime)]"
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-bold text-[var(--brand-navy)]">
          手机号 / 证件后四位
          <span className="ml-1 font-normal text-[var(--muted)]">选填</span>
        </span>
        <input
          type="text"
          value={phoneSuffix}
          onChange={(event) => setPhoneSuffix(event.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="5678"
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          className="h-12 w-full min-w-0 rounded border border-[var(--line)] bg-white px-4 font-mono text-base tracking-widest text-[var(--ink)] transition placeholder:text-[var(--muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-lime)]"
        />
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded bg-[var(--brand-navy)] px-6 text-base font-bold text-white transition hover:bg-[rgba(23,27,64,0.92)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <LoaderIcon className="h-5 w-5 animate-spin" />
            查询中
          </>
        ) : (
          <>
            <SearchIcon className="h-5 w-5" />
            查询我的出发时间
          </>
        )}
      </button>
    </form>
  );
}
