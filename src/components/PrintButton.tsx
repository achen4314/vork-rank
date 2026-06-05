"use client";

import { PrinterIcon } from "@/components/Icons";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="打印成绩单"
      className="inline-flex h-10 items-center gap-2 rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:bg-white"
    >
      <PrinterIcon className="h-4 w-4" />
      打印成绩单
    </button>
  );
}
