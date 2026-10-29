import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { CircularMatch } from "@/components/ui/circular-match";

export const metadata: Metadata = {
  title: "My Applications",
};

function statusConfig(status: string) {
  switch (status) {
    case "APPLIED":
      return { label: "Applied", color: "bg-blue-100 text-blue-700", icon: Clock };
    case "SCREENING":
      return { label: "Screening", color: "bg-amber-100 text-amber-700", icon: Eye };
    case "INTERVIEW":
      return { label: "Interview", color: "bg-violet-100 text-violet-700", icon: FileText };
    case "OFFER":
      return { label: "Offered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
    case "REJECTED":
      return { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle };
    default:
      return { label: status, color: "bg-muted text-muted-foreground", icon: Clock };
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "JOBSEEKER") {
    redirect("/dashboard");
  }

  // Application references jobSeekerId (JobSeekerProfile.id), not User.id
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const applications = profile
    ? await prisma.application.findMany({
        where: { jobSeekerId: profile.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              locationType: true,
              jobType: true,
              salaryMin: true,
              salaryMax: true,
              skills: true,
              recruiter: {
                select: {
                  companyName: true,
                  companyLogo: true,
                },
              },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track the status of all your job applications.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["APPLIED", "SCREENING", "INTERVIEW", "OFFER"] as const).map((status) => {
          const count = applications.filter((a) => a.status === status).length;
          const config = statusConfig(status);
          return (
            <Card key={status} className="py-3">
              <CardContent className="pt-0 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application list */}
      {applications.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-0">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No applications yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start applying to jobs to track your progress here.
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
        <div className="space-y-3">
          {applications.map((app) => {
            const config = statusConfig(app.status);
            const StatusIcon = config.icon;
            return (
              <Link key={app.id} href={`/jobs/${app.job.id}`}>
                <Card className="hover-lift cursor-pointer py-4 transition-all hover:border-primary/20">
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{app.job.title}</h3>
                          <Badge className={`text-[10px] border-0 ${config.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {app.job.recruiter?.companyName || "Unknown Company"}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {app.job.location}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {timeAgo(app.appliedAt)}
                          </span>
                        </div>
                      </div>
                      {app.matchScore && app.matchScore > 0 && (
                        <div className="shrink-0">
                          <CircularMatch percentage={Math.round(app.matchScore * 100)} size={44} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
