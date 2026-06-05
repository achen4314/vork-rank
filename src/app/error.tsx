"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-xl rounded border border-[var(--red)] bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase text-[var(--muted)]">Error</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--brand-navy)]">数据加载失败</h1>
        <p className="mt-3 text-sm text-[var(--red)]">{error.message || "页面暂时无法加载"}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 h-10 rounded border border-[var(--brand-navy)] bg-[var(--brand-lime)] px-4 font-bold text-[var(--brand-navy)] transition hover:bg-white"
        >
          重试
        </button>
      </section>
    </main>
  );
}
