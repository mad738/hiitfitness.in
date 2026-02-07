"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthWiseRow } from "@/data/dummy-admin-data";

type Props = {
  data: MonthWiseRow[];
  formatINR: (value: number) => string;
};

const strokeColor = "rgb(239 68 68)";

export function DashboardCharts({ data, formatINR }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:border-brand-red/25 hover:shadow-[0_0_24px_rgba(255,0,0,0.1)]">
        <p className="text-stone-400 text-sm font-medium mb-4">
          New entries by month
        </p>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: "#a8a29e", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a8a29e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23,23,23,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#d6d3d1" }}
                formatter={(value: number | undefined) => [value ?? 0, "Entries"]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="entries"
                name="Entries"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#fillEntries)"
                dot={{ fill: strokeColor, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: strokeColor, stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:border-brand-red/25 hover:shadow-[0_0_24px_rgba(255,0,0,0.1)]">
        <p className="text-stone-400 text-sm font-medium mb-4">
          Revenue by month (₹)
        </p>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: "#a8a29e", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a8a29e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23,23,23,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#d6d3d1" }}
                formatter={(value: number | undefined) => [formatINR(value ?? 0), "Revenue"]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#fillRevenue)"
                dot={{ fill: strokeColor, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: strokeColor, stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
