import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Redirect /results to /results/race-results
  if (pathname === "/results") {
    return NextResponse.redirect(new URL("/results/race-results", request.url));
  }

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    // Allow login page
    if (pathname === "/admin/login") return response;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an admin
    const { data: admin } = await supabase
      .from("admins")
      .select("role, event_slug")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!admin) {
      const notFoundUrl = new URL("/admin/login?error=unauthorized", request.url);
      return NextResponse.redirect(notFoundUrl);
    }
  }

  // Protect /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("role, event_slug")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!admin) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/results", "/admin/:path*", "/api/admin/:path*"],
};
