import Link from "next/link";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const from = params.from;
  const redirectTo =
    typeof from === "string" ? from : Array.isArray(from) ? from[0] : null;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-brand-red transition-colors group"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden>
          ←
        </span>
        <span>Back to home</span>
      </Link>
      <div className="w-full max-w-md liquid-glass p-6 sm:p-8 rounded-2xl shadow-xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-2 text-center tracking-tight">
          Admin sign in
        </h1>
        <p className="text-stone-400 text-sm text-center mb-6">
          HIIT Fitness
        </p>
        <AdminLoginForm redirectTo={redirectTo ?? undefined} />
      </div>
    </div>
  );
}
