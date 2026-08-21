import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — USTP Supply & Property Management System",
};

// Server Component: reads `redirectTo` from the query string server-side
// (searchParams is a Promise as of Next 15+, see node_modules/next/dist/docs/
// 01-app/03-api-reference/03-file-conventions/page.md) and hands it to the
// client form, instead of calling useSearchParams() client-side — avoids
// needing a Suspense boundary just for a single query param.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
