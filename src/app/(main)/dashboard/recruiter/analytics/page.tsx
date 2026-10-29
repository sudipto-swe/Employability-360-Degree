import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/dashboard");
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let activeJobs = 0;
  let totalApplicants = 0;
  let totalViews = 0;
  let offerCount = 0;
  let rejectedCount = 0;
  let interviewCount = 0;
  let screeningCount = 0;
  let appliedCount = 0;
  let topJobs: { title: string; applicants: number; views: number }[] = [];

  if (profile) {
    const [
      jobs,
      applicants,
      views,
      offers,
      rejected,
      interviews,
      screening,
      applied,
      jobsWithStats,
    ] = await Promise.all([
      prisma.job.count({ where: { recruiterId: profile.id, isActive: true } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id } } }),
      prisma.job.aggregate({ where: { recruiterId: profile.id }, _sum: { viewCount: true } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "OFFER" } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "REJECTED" } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "INTERVIEW" } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "SCREENING" } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "APPLIED" } }),
      prisma.job.findMany({
        where: { recruiterId: profile.id },
        select: {
          title: true,
          viewCount: true,
          _count: { select: { applications: true } },
        },
        orderBy: { viewCount: "desc" },
        take: 5,
      }),
    ]);

    activeJobs = jobs;
    totalApplicants = applicants;
    totalViews = views._sum.viewCount || 0;
    offerCount = offers;
    rejectedCount = rejected;
    interviewCount = interviews;
    screeningCount = screening;
    appliedCount = applied;
    topJobs = jobsWithStats.map((j) => ({
      title: j.title,
      applicants: j._count.applications,
      views: j.viewCount,
    }));
  }

  const conversionRate = totalApplicants > 0
    ? `${((offerCount / totalApplicants) * 100).toFixed(1)}%`
    : "0%";

  const METRICS = [
    {
      label: "Total Applicants",
      value: totalApplicants.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: "Job Views",
      value: totalViews.toString(),
      icon: Eye,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
    {
      label: "Active Jobs",
      value: activeJobs.toString(),
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Conversion Rate",
      value: conversionRate,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
  ];

  // Funnel stages
  const funnelStages = [
    { label: "Applied", count: appliedCount, color: "bg-blue-500", pct: totalApplicants > 0 ? Math.round((appliedCount / totalApplicants) * 100) : 0 },
    { label: "Screening", count: screeningCount, color: "bg-cyan-500", pct: totalApplicants > 0 ? Math.round((screeningCount / totalApplicants) * 100) : 0 },
    { label: "Interview", count: interviewCount, color: "bg-violet-500", pct: totalApplicants > 0 ? Math.round((interviewCount / totalApplicants) * 100) : 0 },
    { label: "Offer", count: offerCount, color: "bg-emerald-500", pct: totalApplicants > 0 ? Math.round((offerCount / totalApplicants) * 100) : 0 },
    { label: "Rejected", count: rejectedCount, color: "bg-red-500", pct: totalApplicants > 0 ? Math.round((rejectedCount / totalApplicants) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your hiring performance and application trends.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="py-5">
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Hiring Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {totalApplicants === 0 ? (
              <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Funnel data will appear once you have applicants
                  </p>
                </div>
              </div>
            ) : (
              funnelStages.map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">
                      {stage.count} ({stage.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(stage.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top performing jobs */}
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Top Performing Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topJobs.length === 0 ? (
              <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Post jobs to see performance data here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {topJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium truncate">{job.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.applicants}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">{offerCount}</p>
              <p className="text-xs text-muted-foreground">Offers Made</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-lg font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold">{interviewCount}</p>
              <p className="text-xs text-muted-foreground">In Interview</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold">{screeningCount}</p>
              <p className="text-xs text-muted-foreground">In Screening</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
