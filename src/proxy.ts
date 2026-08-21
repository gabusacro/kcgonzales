import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route protection + edge role gating for /admin/*.
//
// NOTE ON FILE NAME: the task brief asked for `src/middleware.ts`, but this
// repo is on Next.js 16 (see package.json), where the `middleware.ts` file
// convention was renamed to `proxy.ts` (same behavior, new name/export —
// see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// proxy.md, which explicitly says the old convention is deprecated). Per
// AGENTS.md's instruction to check the bundled docs before writing
// Next-specific code and heed deprecation notices, this is `src/proxy.ts`
// exporting `proxy` instead.
//
// This follows Supabase's documented @supabase/ssr proxy/middleware pattern
// (supabase.com/docs/guides/auth/server-side/nextjs): call
// `supabase.auth.getUser()` on every request so expiring session tokens are
// silently refreshed and written back to cookies. That's an Auth-server
// call, not a Postgres query, so it doesn't conflict with Next's "avoid
// database checks in Proxy" performance guidance.
//
// The /admin/* role gate reads a small `user_role` cookie (set by the login
// server action in src/app/login/actions.ts) rather than querying the
// database — this is an OPTIMISTIC check only, matching Next's own
// recommendation to keep Proxy checks cookie-based. RLS (see
// supabase/migrations/) is the real, non-bypassable enforcement layer;
// nothing here should be treated as the sole line of defense.

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Not signed in and hitting a protected route -> bounce to /login,
  // remembering where they were headed.
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in and hitting /login -> skip straight to the app.
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // /admin/* is System Administrator-only per the Use Case diagram
  // (Figure 3.5) — Supply Officer and Faculty/Staff never get this nav
  // section in a correctly-filtered UI, but this is the hard edge-level
  // stop regardless of what the client renders. RLS backs this up at the
  // data layer for every table under here (users, roles, role_permissions,
  // system_settings, system_logs).
  if (user && pathname.startsWith("/admin")) {
    const role = request.cookies.get("user_role")?.value;
    if (role !== "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
