"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

// Server Action backing the login form (src/app/login/LoginForm.tsx). Runs
// entirely server-side using the cookie-aware server client (src/lib/
// supabase/server.ts), so the session cookie Supabase sets is visible to
// proxy.ts and every Server Component on the very next request.
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard") || "/dashboard";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: "Invalid email or password." };
  }

  // Pull the profile + role name in one round trip (relies on the FK
  // between public.users.role_id and public.roles.role_id for the
  // PostgREST embed — see supabase/migrations/20260821000300_users_and_auth.sql).
  const { data: profile } = await supabase
    .from("users")
    .select("status, roles(name)")
    .eq("id", authData.user.id)
    .single();

  const roleName = (profile as { roles?: { name?: string } } | null)?.roles?.name;

  if (!profile || profile.status === "inactive") {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Contact your administrator." };
  }

  // Optimistic, non-authoritative role hint for proxy.ts's /admin/* edge
  // check — httpOnly so client JS can't read/tamper with it, but it is NOT
  // itself a security boundary (RLS is). Kept separate from Supabase's own
  // session cookies.
  if (roleName) {
    const cookieStore = await cookies();
    cookieStore.set("user_role", roleName, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  // Best-effort audit log entry (see migration 08's log_login() RPC). Not
  // awaited-critical to the login flow — if it fails, we still let the
  // user in rather than blocking sign-in over a logging hiccup.
  try {
    await supabase.rpc("log_login");
  } catch {
    // ignored — see comment above
  }

  redirect(redirectTo);
}
