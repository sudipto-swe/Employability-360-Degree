"use client";

/**
 * Admin Analytics Page
 * 
 * Platform-wide metrics and growth trends.
 */

import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GROWTH_DATA = [
  { month: "Jan", users: 120, jobs: 45 },
  { month: "Feb", users: 190, jobs: 62 },
  { month: "Mar", users: 310, jobs: 89 },
  { month: "Apr", users: 480, jobs: 134 },
  { month: "May", users: 650, jobs: 187 },
  { month: "Jun", users: 890, jobs: 245 },
];

const TOP_CATEGORIES = [
  { name: "Software Engineering", jobs: 89, percentage: 36 },
  { name: "Data Science", jobs: 45, percentage: 18 },
  { name: "Marketing & Sales", jobs: 38, percentage: 15 },
  { name: "Product & Design", jobs: 32, percentage: 13 },
  { name: "Finance", jobs: 24, percentage: 10 },
  { name: "Others", jobs: 17, percentage: 8 },
];

export default function AdminAnalyticsPage() {
  const maxUsers = Math.max(...GROWTH_DATA.map((d) => d.users));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Platform Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide growth metrics and trends.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Active Users", value: "890", change: "+37%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "New Jobs This Month", value: "245", change: "+31%", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Applications/Day", value: "47", change: "+12%", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Revenue (BDT)", value: "৳89,500", change: "+45%", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
        ].map((m) => (
          <Card key={m.label} className="py-5">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <span className="text-xs text-emerald-600 font-medium flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {m.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User growth chart */}
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle className="text-base">User Growth (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3 h-48">
              {GROWTH_DATA.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{d.users}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                    style={{ height: `${(d.users / maxUsers) * 160}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle className="text-base">Jobs by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {TOP_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{cat.name}</span>
                  <span className="font-medium">{cat.jobs} jobs ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
