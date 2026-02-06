import { AdminLoginForm } from "@/features/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-100 mb-6 text-center">
          Admin sign in
        </h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
