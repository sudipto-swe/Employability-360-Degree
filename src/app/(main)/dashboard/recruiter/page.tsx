import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Users,
  TrendingUp,
  CreditCard,
  PlusCircle,
  ArrowRight,
  BarChart3,
  Kanban,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recruiter Dashboard",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return "just now";
}

export default async function RecruiterDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/dashboard");
  }

  const firstName = session.user.name?.split(" ")[0] || "there";

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isPremium: true, totalJobsPosted: true },
  });

  let activeJobs = 0;
  let totalApplicants = 0;
  let totalJobViews = 0;
  let hireCount = 0;
  let activities: {
    id: string;
    type: "application" | "offer" | "view";
    title: string;
    description: string;
    date: Date;
  }[] = [];

  if (profile) {
    const [jobs, applicants, offers, jobViews, recentApps] = await Promise.all([
      prisma.job.count({ where: { recruiterId: profile.id, isActive: true } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id } } }),
      prisma.application.count({ where: { job: { recruiterId: profile.id }, status: "OFFER" } }),
      prisma.job.aggregate({ where: { recruiterId: profile.id }, _sum: { viewCount: true } }),
      prisma.application.findMany({
        where: { job: { recruiterId: profile.id } },
        include: {
          jobSeeker: {
            select: {
              user: { select: { name: true } },
            },
          },
          job: { select: { title: true } },
        },
        orderBy: { appliedAt: "desc" },
        take: 8,
      }),
    ]);

    activeJobs = jobs;
    totalApplicants = applicants;
    hireCount = offers;
    totalJobViews = jobViews._sum.viewCount || 0;

    activities = recentApps.map((app) => ({
      id: app.id,
      type: app.status === "OFFER" ? "offer" as const : "application" as const,
      title: app.status === "OFFER"
        ? "Offer Extended"
        : app.status === "INTERVIEW"
        ? "Moved to Interview"
        : "New Application",
      description: `${app.jobSeeker.user.name || "A candidate"} — ${app.job.title} (${app.status})`,
      date: app.appliedAt,
    }));
  }

  const hireRate = totalApplicants > 0 ? `${Math.round((hireCount / totalApplicants) * 100)}%` : "—";

  // Determine user plan label
  const planLabel = profile?.isPremium ? "Premium" : "Free";

  const stats = [
    { label: "Active Jobs", value: activeJobs.toString(), icon: Briefcase },
    { label: "Total Applicants", value: totalApplicants.toString(), icon: Users },
    { label: "Hire Rate", value: hireRate, icon: TrendingUp },
    { label: "Plan", value: planLabel, icon: CreditCard },
  ];

  const actions = [
    {
      title: "Post a New Job",
      description: "Create a job listing and reach thousands of qualified candidates across Bangladesh.",
      icon: PlusCircle,
      href: "/dashboard/recruiter/post-job",
      gradient: "from-teal-500 to-emerald-500",
    },
    {
      title: "View Candidates",
      description: "Browse AI-matched candidates based on skills, experience, and compatibility scores.",
      icon: Users,
      href: "/dashboard/recruiter/candidates",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Application Pipeline",
      description: "Manage applicants across stages: Applied → Screening → Interview → Offer.",
      icon: Kanban,
      href: "/dashboard/recruiter/pipeline",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Analytics",
      description: "View job performance metrics, applicant demographics, and hiring funnel data.",
      icon: BarChart3,
      href: "/dashboard/recruiter/analytics",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings and find the best talent.
          </p>
        </div>
        <Link href="/dashboard/recruiter/post-job">
          <Button className="gradient-brand text-white border-0 hidden sm:flex">
            <PlusCircle className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="py-4">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick overview row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalJobViews}</p>
              <p className="text-xs text-muted-foreground">Total Job Views</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{hireCount}</p>
              <p className="text-xs text-muted-foreground">Offers Extended</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.totalJobsPosted || 0}</p>
              <p className="text-xs text-muted-foreground">Total Jobs Posted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium banner for free users */}
      {!profile?.isPremium && (
        <Card className="gradient-brand text-white border-0 overflow-hidden relative py-6">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <CardContent className="relative z-10 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <Badge className="bg-white/20 text-white border-0 mb-2">Free Plan</Badge>
                <h3 className="text-lg font-bold">Upgrade to Premium</h3>
                <p className="text-white/80 text-sm mt-1">
                  Unlock more job posts, advanced analytics, and priority candidate matching.
                </p>
              </div>
              <Link href="/dashboard/recruiter/subscription">
                <Button className="bg-white text-primary hover:bg-white/90 shrink-0">
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {actions.map(({ title, description, icon: Icon, href, gradient }) => (
            <Link key={title} href={href}>
              <Card className="group hover-lift cursor-pointer h-full py-5 transition-all hover:border-primary/20">
                <CardContent className="flex gap-4 pt-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {activities.length === 0 ? (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center text-center pt-0">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Post a job to start receiving applications and tracking activity.
              </p>
              <Link href="/dashboard/recruiter/post-job">
                <Button className="gradient-brand text-white border-0">
                  Post Your First Job
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        act.type === "offer"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {act.type === "offer" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{act.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(act.date)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
