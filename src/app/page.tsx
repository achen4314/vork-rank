import Image from "next/image";
import Link from "next/link";
import { PUBLIC_NAV_ITEMS, EVENT_DISPLAY_NAME } from "@/lib/eventConfig";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper)]">
      <header className="brand-shell overflow-hidden border-b border-[var(--brand-navy)] bg-white">
        <div className="brand-stripe" aria-hidden="true" />
        <div className="mx-auto flex max-w-[800px] flex-col items-center gap-2 px-4 py-8 text-center sm:py-12">
          <div className="grid h-20 w-28 place-items-center rounded-sm bg-[var(--brand-navy)] p-3 sm:h-24 sm:w-32">
            <Image
              src="/brand/vork-mark-lime.png"
              alt="VORK"
              width={358}
              height={188}
              priority
              sizes="128px"
              className="h-auto w-full"
            />
          </div>
          <Image
            src="/brand/vork-wordmark.png"
            alt="VORK"
            width={439}
            height={94}
            priority
            sizes="180px"
            className="mt-2 h-6 w-auto"
          />
          <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--brand-navy)] sm:text-3xl">
            {EVENT_DISPLAY_NAME}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[800px] px-4 py-8 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded border-2 border-[var(--line)] bg-white p-6 shadow-sm 
                         transition hover:border-[var(--brand-navy)] hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg 
                                 bg-[var(--brand-soft)] text-2xl transition 
                                 group-hover:bg-[var(--brand-lime)]">
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-[var(--brand-navy)]">
                    {item.label}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-12 text-center">
          <Link
            href="/admin"
            className="text-xs font-bold text-[var(--muted)] transition hover:text-[var(--brand-navy)]"
          >
            管理后台
          </Link>
        </footer>
      </div>
    </main>
  );
}
