import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /auth/signout — clears the Supabase session + the optimistic
// user_role cookie (see src/proxy.ts) and sends the user back to /login.
// Wired to the existing sidebar "Logout" links (src/components/layout/
// Sidebar.tsx, EndUserShell.tsx) via a tiny <form method="post"> instead of
// their old `<Link href="/">`, since a plain link can't safely trigger a
// server-side mutation like signOut().
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("user_role");

  return NextResponse.redirect(new URL("/login", request.url));
}
