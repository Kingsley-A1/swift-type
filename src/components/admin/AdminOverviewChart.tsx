"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminTrendPoint } from "@/lib/adminData";

interface AdminOverviewChartProps {
  data: AdminTrendPoint[];
}

export function AdminOverviewChart({ data }: AdminOverviewChartProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="h-64 rounded-xl border border-gray-100 bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sessions"
              stroke="#ff6b35"
              strokeWidth={3}
              dot={false}
              name="Typing sessions"
            />
            <Line
              type="monotone"
              dataKey="chats"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
              name="Swift AI chats"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              name="New users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64 rounded-xl border border-gray-100 bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="practiceMinutes"
              fill="#fb923c"
              radius={[8, 8, 0, 0]}
              name="Practice minutes"
            />
            <Bar
              dataKey="goalsCompleted"
              fill="#0f172a"
              radius={[8, 8, 0, 0]}
              name="Goals completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
