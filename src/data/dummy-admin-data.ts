/**
 * Andhra Pradesh / India–authentic dummy data for admin (Vijayawada centre).
 * Used when "Use sample data" is on across Dashboard, Tracker, Admin users, Customers, Plans, Subscriptions.
 */

import type { Tracker } from "@/models/tracker";
import type { Credential } from "@/models/credential";

const ISO_NOW = new Date().toISOString();

/** Full dummy tracker list for Tracker page and dashboard trainer reports */
export const DUMMY_TRACKER_LIST: Tracker[] = [
  {
    id: "d1",
    client_id: "VZD-001",
    client_name: "Raju Kumar",
    plan: "GT",
    frequency: "12M",
    trainer_name: "Manoj",
    start_date: "2025-12-01",
    end_date: "2026-11-30",
    total_fee: 18000,
    paid_fee: 18000,
    due_fee: 0,
    mobile: "9876543210",
    pay_date: "2025-12-01",
    payment_mode: "Cash",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d2",
    client_id: "VZD-002",
    client_name: "Lakshmi Devi",
    plan: "PT",
    frequency: "3M",
    trainer_name: "Manoj",
    start_date: "2026-01-10",
    end_date: "2026-04-09",
    total_fee: 7500,
    paid_fee: 7500,
    due_fee: 0,
    mobile: "9123456789",
    pay_date: "2026-01-10",
    payment_mode: "Rohit UPI",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d3",
    client_id: "VZD-003",
    client_name: "Suresh Reddy",
    plan: "GT",
    frequency: "6M",
    trainer_name: "Manoj",
    start_date: "2025-11-15",
    end_date: "2026-05-14",
    total_fee: 9000,
    paid_fee: 6000,
    due_fee: 3000,
    mobile: "9988776655",
    pay_date: "2025-11-15",
    payment_mode: "Cash",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d4",
    client_id: "VZD-004",
    client_name: "Kavitha",
    plan: "PT",
    frequency: "1M",
    trainer_name: "Narendra",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    total_fee: 2500,
    paid_fee: 2500,
    due_fee: 0,
    mobile: "9876123456",
    pay_date: "2026-02-01",
    payment_mode: "Manoj UPI",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d5",
    client_id: "VZD-005",
    client_name: "Venkat Rao",
    plan: "GT",
    frequency: "12M",
    trainer_name: "Narendra",
    start_date: "2025-10-01",
    end_date: "2026-09-30",
    total_fee: 18000,
    paid_fee: 18000,
    due_fee: 0,
    mobile: "8765432109",
    pay_date: "2025-10-01",
    payment_mode: "Rohit Swipe",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d6",
    client_id: "VZD-006",
    client_name: "Padma",
    plan: "PT",
    frequency: "6M",
    trainer_name: "Sandeep",
    start_date: "2026-01-05",
    end_date: "2026-07-04",
    total_fee: 15000,
    paid_fee: 15000,
    due_fee: 0,
    mobile: "7654321098",
    pay_date: "2026-01-05",
    payment_mode: "Cash",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: "d7",
    client_id: "VZD-007",
    client_name: "Ramesh",
    plan: "GT",
    frequency: "3M",
    trainer_name: "Sandeep",
    start_date: "2026-02-01",
    end_date: "2026-04-30",
    total_fee: 4500,
    paid_fee: 4500,
    due_fee: 0,
    mobile: null,
    pay_date: "2026-02-01",
    payment_mode: "SS UPI",
    paid_to: "R",
    paid_flag: true,
    remarks: null,
    status: "Active",
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
];

/** Dummy credentials for Admin users page (display only; no real passwords) */
export const DUMMY_CREDENTIALS: Credential[] = [
  {
    id: "dc1",
    username: "admin_vijayawada",
    pass: "********",
    role: "admin",
    created_at: "2025-06-01T10:00:00Z",
    updated_at: ISO_NOW,
  },
  {
    id: "dc2",
    username: "manager_guntur",
    pass: "********",
    role: "manager",
    created_at: "2025-08-15T09:00:00Z",
    updated_at: ISO_NOW,
  },
  {
    id: "dc3",
    username: "staff_tenali",
    pass: "********",
    role: "staff",
    created_at: "2025-11-01T11:00:00Z",
    updated_at: ISO_NOW,
  },
];

export type DummyCustomer = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export const DUMMY_CUSTOMERS: DummyCustomer[] = [
  {
    id: "cust1",
    email: "raju.kumar@gmail.com",
    full_name: "Raju Kumar",
    phone: "9876543210",
    created_at: "2025-09-01",
  },
  {
    id: "cust2",
    email: "lakshmi.d@yahoo.co.in",
    full_name: "Lakshmi Devi",
    phone: "9123456789",
    created_at: "2025-10-12",
  },
  {
    id: "cust3",
    email: "suresh.reddy@gmail.com",
    full_name: "Suresh Reddy",
    phone: "9988776655",
    created_at: "2025-11-01",
  },
  {
    id: "cust4",
    email: "kavitha.pt@gmail.com",
    full_name: "Kavitha",
    phone: "9876123456",
    created_at: "2026-01-05",
  },
  {
    id: "cust5",
    email: "venkat.rao@outlook.com",
    full_name: "Venkat Rao",
    phone: "8765432109",
    created_at: "2025-08-20",
  },
];

export type DummyPlan = {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
};

export const DUMMY_PLANS: DummyPlan[] = [
  {
    id: "plan1",
    name: "GT 12 Months",
    description: "Group Training – 12 months, Vijayawada centre",
    price_monthly: 1500,
    duration_days: 365,
    is_active: true,
    created_at: "2025-01-01",
  },
  {
    id: "plan2",
    name: "PT 3 Months",
    description: "Personal Training – 3 months",
    price_monthly: 2500,
    duration_days: 90,
    is_active: true,
    created_at: "2025-01-01",
  },
  {
    id: "plan3",
    name: "GT 6 Months",
    description: "Group Training – 6 months",
    price_monthly: 1500,
    duration_days: 180,
    is_active: true,
    created_at: "2025-01-01",
  },
  {
    id: "plan4",
    name: "PT 1 Month",
    description: "Personal Training – 1 month trial",
    price_monthly: 2500,
    duration_days: 30,
    is_active: true,
    created_at: "2025-06-01",
  },
];

export type DummySubscription = {
  id: string;
  customer_id: string;
  customer_name: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

export const DUMMY_SUBSCRIPTIONS: DummySubscription[] = [
  {
    id: "sub1",
    customer_id: "cust1",
    customer_name: "Raju Kumar",
    plan_id: "plan1",
    plan_name: "GT 12 Months",
    start_date: "2025-12-01",
    end_date: "2026-11-30",
    status: "active",
    created_at: "2025-12-01",
  },
  {
    id: "sub2",
    customer_id: "cust2",
    customer_name: "Lakshmi Devi",
    plan_id: "plan2",
    plan_name: "PT 3 Months",
    start_date: "2026-01-10",
    end_date: "2026-04-09",
    status: "active",
    created_at: "2026-01-10",
  },
  {
    id: "sub3",
    customer_id: "cust3",
    customer_name: "Suresh Reddy",
    plan_id: "plan3",
    plan_name: "GT 6 Months",
    start_date: "2025-11-15",
    end_date: "2026-05-14",
    status: "active",
    created_at: "2025-11-15",
  },
  {
    id: "sub4",
    customer_id: "cust4",
    customer_name: "Kavitha",
    plan_id: "plan4",
    plan_name: "PT 1 Month",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    status: "active",
    created_at: "2026-02-01",
  },
];

/** Dashboard aggregate dummy stats (customers-based) */
export const DUMMY_DASHBOARD = {
  customerCount: 48,
  gtCount: 32,
  ptCount: 16,
  adminCount: 3,
  newCustomersThisMonth: 24,
  revenueThisMonth: 147800,
};

/** Month-wise entries and revenue for charts (last 12 months, AP/INR) */
export type MonthWiseRow = {
  month: string;
  monthLabel: string;
  entries: number;
  revenue: number;
};

function getLast12Months(): MonthWiseRow[] {
  const rows: MonthWiseRow[] = [];
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
    rows.push({
      month: monthKey,
      monthLabel,
      entries: 0,
      revenue: 0,
    });
  }
  return rows;
}

export const DUMMY_MONTH_WISE: MonthWiseRow[] = (() => {
  const months = getLast12Months();
  const seed = [18, 22, 15, 28, 24, 20, 26, 31, 19, 23, 27, 24];
  const revenueSeed = [89000, 112000, 95000, 135000, 147800, 118000, 142000, 168000, 102000, 128000, 155000, 147800];
  return months.map((row, i) => ({
    ...row,
    entries: seed[i % seed.length] ?? 20,
    revenue: revenueSeed[i % revenueSeed.length] ?? 120000,
  }));
})();

export const DUMMY_LABEL = "Sample data (Vijayawada centre, Andhra Pradesh)";
