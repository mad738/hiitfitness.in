import { AdminNav } from "@/features/admin/AdminNav";
import { AdminBackLink } from "@/features/admin/AdminBackLink";
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // bypassed auth for debug

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
