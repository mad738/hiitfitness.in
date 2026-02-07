import { getTrackerList } from "@app/actions/tracker";
import { listCredentials } from "@/repositories/credential_repository";
import { DashboardContent } from "@/features/admin/DashboardContent";
import type { MonthWiseRow } from "@/data/dummy-admin-data";

function getLast12MonthKeys(): { month: string; monthLabel: string }[] {
  const rows: { month: string; monthLabel: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    rows.push({ month: monthKey, monthLabel });
  }
  return rows;
}

export default async function AdminDashboardPage() {
  const [trackerList, credentials] = await Promise.all([
    getTrackerList(),
    listCredentials(),
  ]);

  const trackerCount = trackerList.length;
  const byPlan = trackerList.reduce(
    (acc, row) => {
      const p = row.plan ?? "—";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const gtCount = byPlan["GT"] ?? 0;
  const ptCount = byPlan["PT"] ?? 0;

  const byTrainer = trackerList.reduce(
    (acc, row) => {
      const trainer = row.trainer_name ?? "—";
      if (!acc[trainer]) acc[trainer] = [];
      acc[trainer].push(row);
      return acc;
    },
    {} as Record<string, typeof trackerList>
  );
  const trainerReports = Object.entries(byTrainer)
    .map(([name, entries]) => ({ name, entries }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1)).toISOString();
  const monthEnd = new Date(
    Date.UTC(year, month + 1, 0, 23, 59, 59, 999)
  ).toISOString();
  const thisMonthEntries = trackerList.filter(
    (r) => r.created_at >= monthStart && r.created_at <= monthEnd
  );
  const newEntriesThisMonth = thisMonthEntries.length;
  const revenueThisMonth = thisMonthEntries.reduce(
    (sum, r) => sum + (r.paid_fee ?? 0),
    0
  );

  const monthKeys = getLast12MonthKeys();
  const monthWiseData: MonthWiseRow[] = monthKeys.map(({ month, monthLabel }) => {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();
    const inMonth = trackerList.filter(
      (r) => r.created_at >= start && r.created_at <= end
    );
    const entries = inMonth.length;
    const revenue = inMonth.reduce((s, r) => s + (r.paid_fee ?? 0), 0);
    return { month, monthLabel, entries, revenue };
  });

  return (
    <DashboardContent
      trackerCount={trackerCount}
      gtCount={gtCount}
      ptCount={ptCount}
      adminCount={credentials.length}
      newEntriesThisMonth={newEntriesThisMonth}
      revenueThisMonth={revenueThisMonth}
      trainerReports={trainerReports}
      monthWiseData={monthWiseData}
    />
  );
}
