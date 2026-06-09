"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  SearchIcon,
  ClockIcon,
  CheckCircleIcon,
  LogOutIcon,
  ShieldIcon,
} from "@/components/Icons";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: ShieldIcon, exact: true },
  { href: "/admin/registrations", label: "报名管理", icon: SearchIcon },
  { href: "/admin/waves", label: "波次管理", icon: ClockIcon },
  { href: "/admin/assign", label: "一键分配", icon: CheckCircleIcon },
  { href: "/admin/audit", label: "操作日志", icon: CheckCircleIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/admin/login");
        return;
      }
      setUserEmail(data.user.email ?? "");
      setLoading(false);
    })();
  }, [supabase, router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <p className="text-[var(--muted)]">加载中...</p>
      </div>
    );
  }

  // Login page: render without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="brand-stripe" aria-hidden="true" />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden h-screen w-[220px] shrink-0 flex-col border-r border-[var(--line)] 
                            bg-white lg:flex">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-5">
            <div className="grid h-9 w-12 shrink-0 place-items-center rounded-sm bg-[var(--brand-navy)]">
              <span className="text-xs font-black text-[var(--brand-lime)]">VORK</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--brand-navy)]">管理后台</p>
              <p className="truncate text-xs text-[var(--muted)]">{userEmail}</p>
            </div>
          </div>
          <nav className="flex-1 p-3">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && item.href !== "/admin";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 rounded px-3 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-navy)]"
                      : "text-[var(--muted)] hover:bg-[var(--metric)] hover:text-[var(--brand-navy)]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[var(--line)] p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-bold 
                         text-[var(--muted)] transition hover:bg-red-50 hover:text-[var(--red)]"
            >
              <LogOutIcon className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-1 flex-col min-h-screen">
          <header className="flex items-center justify-between border-b border-[var(--line)] 
                            bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-10 place-items-center rounded-sm bg-[var(--brand-navy)]">
                <span className="text-[10px] font-black text-[var(--brand-lime)]">VORK</span>
              </div>
              <p className="text-sm font-black text-[var(--brand-navy)]">管理后台</p>
            </div>
            <div className="flex gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    pathname.startsWith(item.href)
                      ? "bg-[var(--brand-soft)] text-[var(--brand-navy)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="rounded px-2 py-1 text-xs font-bold text-[var(--red)]"
              >
                退出
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
