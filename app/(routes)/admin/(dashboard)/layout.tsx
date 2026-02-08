import { redirect } from "next/navigation";
import { AdminNav } from "@/features/admin/AdminNav";
import { AdminBackLink } from "@/features/admin/AdminBackLink";
import { hasSupabaseConfig } from "@/config/env";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (!hasSupabaseConfig()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="liquid-glass max-w-lg p-8 rounded-2xl text-center">
          <h1 className="font-display text-xl font-bold uppercase text-stone-100 mb-2 tracking-tight">
            Supabase not configured
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            Add <code className="bg-white/10 px-1.5 py-0.5 rounded text-stone-300">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-stone-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-stone-300">.env.local</code> (see .env.example).
          </p>
          <a
            href="/admin/login"
            className="text-brand-red font-semibold text-sm hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav />
      <main
        className="flex-1 pt-[var(--header-height)] min-h-0 overflow-auto lg:pt-0 lg:pl-[var(--admin-sidebar-width)]"
        role="main"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 lg:px-8 lg:py-10">
          <AdminBackLink />
          {children}
        </div>
      </main>
    </div>
  );
}
