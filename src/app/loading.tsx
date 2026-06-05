export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <div className="overflow-hidden rounded border border-[var(--brand-navy)] bg-white">
          <div className="brand-stripe" aria-hidden="true" />
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-20 animate-pulse rounded-sm bg-[var(--line)]" />
              <div>
                <div className="h-5 w-28 animate-pulse rounded bg-[var(--line)]" />
                <div className="mt-3 h-8 w-72 max-w-[70vw] animate-pulse rounded bg-[var(--line)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded border border-[var(--line)] bg-[var(--metric)] px-3 py-2">
                  <div className="h-3 w-14 animate-pulse rounded bg-[var(--line)]" />
                  <div className="mt-2 h-5 w-20 animate-pulse rounded bg-[var(--line)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-3 rounded border border-[var(--line)] bg-white p-3 shadow-sm lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded bg-[var(--line)]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="rounded border border-[var(--line)] bg-white p-3 shadow-sm">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="mb-3 h-8 animate-pulse rounded bg-[var(--line)]" />
            ))}
          </div>
          <div className="rounded border border-[var(--line)] bg-white p-4 shadow-sm">
            <div className="h-6 w-32 animate-pulse rounded bg-[var(--line)]" />
            <div className="mt-4 h-20 animate-pulse rounded bg-[var(--line)]" />
            <div className="mt-3 h-32 animate-pulse rounded bg-[var(--line)]" />
          </div>
        </div>
      </section>
    </main>
  );
}
