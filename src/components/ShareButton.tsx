"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "error";

export default function ShareButton() {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
    } catch {
      setState("error");
    }

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState("idle"), 1800);
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-label="复制选手分享链接"
      className="inline-flex h-10 w-28 items-center justify-center gap-2 rounded border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-navy)]"
    >
      {state === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {state === "copied" ? "已复制" : state === "error" ? "复制失败" : "复制链接"}
    </button>
  );
}
