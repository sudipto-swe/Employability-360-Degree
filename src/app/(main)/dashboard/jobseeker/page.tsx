import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  FileText,
  Briefcase,
  TrendingUp,
  Eye,
  Brain,
  Mic,
  ArrowRight,
  Sparkles,
  Calendar,
  Building,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Job Seeker Dashboard",
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

export default async function JobSeekerDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "JOBSEEKER") {
    redirect("/dashboard");
  }

  const firstName = session.user.name?.split(" ")[0] || "there";

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, profileViews: true }
  });

  let applicationsCount = 0;
  let savedJobsCount = 0;
  let profileViewsCount = 0;
  let avgMatchScore = "—";
  let activities: {
    id: string;
    type: "visit" | "application";
    title: string;
    description: string;
    date: Date;
  }[] = [];

  if (profile) {
    const [appCount, savedCount, matchScores, profileVisits, recentApps] = await Promise.all([
      prisma.application.count({ where: { jobSeekerId: profile.id } }),
      prisma.savedJob.count({ where: { jobSeekerId: profile.id } }),
      prisma.application.findMany({
        where: { jobSeekerId: profile.id, matchScore: { not: null } },
        select: { matchScore: true }
      }),
      prisma.profileVisit.findMany({
        where: { visitedId: session.user.id },
        include: {
          visitor: {
            select: {
              name: true,
              recruiterProfile: {
                select: {
                  companyName: true,
                }
              }
            }
          }
        },
        orderBy: { visitedAt: "desc" },
        take: 5
      }),
      prisma.application.findMany({
        where: { jobSeekerId: profile.id },
        include: {
          job: {
            select: {
              title: true,
              recruiter: {
                select: {
                  companyName: true,
                }
              }
            }
          }
        },
        orderBy: { appliedAt: "desc" },
        take: 5
      })
    ]);

    applicationsCount = appCount;
    savedJobsCount = savedCount;
    // Use actual ProfileVisit count for real-time accuracy
    profileViewsCount = profileVisits.length > 0
      ? await prisma.profileVisit.count({ where: { visitedId: session.user.id } })
      : profile.profileViews;

    if (matchScores.length > 0) {
      const totalScore = matchScores.reduce((acc, curr) => acc + (curr.matchScore || 0), 0);
      avgMatchScore = `${Math.round((totalScore / matchScores.length) * 100)}%`;
    }

    // Build activities stream
    const visitActivities = profileVisits.map((v) => {
      const company = v.visitor.recruiterProfile?.companyName || "a recruiting company";
      return {
        id: v.id,
        type: "visit" as const,
        title: "Profile Viewed",
        description: `A recruiter from ${company} viewed your profile.`,
        date: v.visitedAt,
      };
    });

    const appActivities = recentApps.map((a) => {
      const company = a.job.recruiter?.companyName || "unknown company";
      return {
        id: a.id,
        type: "application" as const,
        title: "Application Submitted",
        description: `You applied for ${a.job.title} at ${company} (Status: ${a.status}).`,
        date: a.appliedAt,
      };
    });

    activities = [...visitActivities, ...appActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }

  const stats = [
    { label: "Applications", value: applicationsCount.toString(), icon: FileText },
    { label: "Profile Views", value: profileViewsCount.toString(), icon: Eye },
    { label: "Match Score", value: avgMatchScore, icon: TrendingUp },
    { label: "Saved Jobs", value: savedJobsCount.toString(), icon: Briefcase },
  ];

  const actions = [
    {
      title: "Upload Resume",
      description: "Upload your CV and let our AI parse your skills and experience automatically.",
      icon: FileText,
      href: "/dashboard/jobseeker/profile",
      gradient: "from-teal-500 to-emerald-500",
      badge: "Start Here",
    },
    {
      title: "AI CV Builder",
      description: "Build a stunning, ATS-friendly CV with AI assistance. Choose from 5 templates.",
      icon: Brain,
      href: "/dashboard/jobseeker/cv-builder",
      gradient: "from-violet-500 to-purple-500",
      badge: "AI Powered",
    },
    {
      title: "Interview Coach",
      description: "Practice with AI-generated questions tailored to your target role and get scored.",
      icon: Mic,
      href: "/dashboard/jobseeker/interview-coach",
      gradient: "from-amber-500 to-orange-500",
      badge: "AI Powered",
    },
    {
      title: "Browse Jobs",
      description: "Explore job listings across Bangladesh. Filter by location, skill, and more.",
      icon: Sparkles,
      href: "/jobs",
      gradient: "from-blue-500 to-cyan-500",
      badge: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your job search progress.
        </p>
      </div>

      {/* Stats grid */}
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

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {actions.map(({ title, description, icon: Icon, href, gradient, badge: badgeText }) => (
            <Link key={title} href={href}>
              <Card className="group hover-lift cursor-pointer h-full py-5 transition-all hover:border-primary/20">
                <CardContent className="flex gap-4 pt-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{title}</h3>
                      {badgeText && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {badgeText}
                        </Badge>
                      )}
                    </div>
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
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Start by uploading your resume or browsing jobs to begin your career journey.
              </p>
              <Link href="/jobs">
                <Button className="gradient-brand text-white border-0">
                  Browse Jobs
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
                        act.type === "visit" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {act.type === "visit" ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <Briefcase className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{act.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
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
