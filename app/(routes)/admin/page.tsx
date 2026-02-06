import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Admin Dashboard</h1>
      <ul className="space-y-2">
        <li>
          <Link
            href="/admin/customers"
            className="text-emerald-400 hover:underline"
          >
            Manage customers
          </Link>
        </li>
        <li>
          <Link
            href="/admin/plans"
            className="text-emerald-400 hover:underline"
          >
            Manage membership plans
          </Link>
        </li>
        <li>
          <Link
            href="/admin/subscriptions"
            className="text-emerald-400 hover:underline"
          >
            View subscriptions
          </Link>
        </li>
      </ul>
    </div>
  );
}
