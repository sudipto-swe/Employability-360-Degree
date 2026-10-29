import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Users,
  BarChart3,
  MapPin,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Job Listings",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

export default async function RecruiterJobsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/dashboard");
  }

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });

  const jobs = recruiterProfile
    ? await prisma.job.findMany({
        where: { recruiterId: recruiterProfile.id },
        include: {
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalApplicants = jobs.reduce((sum, j) => sum + j._count.applications, 0);
  const activeJobs = jobs.filter((j) => j.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Job Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your posted job listings.
          </p>
        </div>
        <Link href="/dashboard/recruiter/post-job">
          <Button className="gradient-brand text-white border-0">
            + Post Job
          </Button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="pt-0 text-center">
            <Briefcase className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{activeJobs}</p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{totalApplicants}</p>
            <p className="text-xs text-muted-foreground">Total Applicants</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="pt-0 text-center">
            <BarChart3 className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{jobs.reduce((s, j) => s + j.viewCount, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Job listings */}
      {jobs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-0">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No jobs posted yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first job listing to start receiving applications.
            </p>
            <Link href="/dashboard/recruiter/post-job">
              <Button className="gradient-brand text-white border-0">
                Post Your First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="py-4 hover:border-primary/20 transition-colors">
              <CardContent className="pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/jobs/${job.id}`} className="font-semibold hover:text-primary transition-colors">
                        {job.title}
                      </Link>
                      <Badge variant={job.isActive ? "default" : "secondary"} className="text-[10px]">
                        {job.isActive ? "Active" : "Closed"}
                      </Badge>
                      {job.isFeatured && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span>{job.jobType}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className="text-center">
                      <p className="font-bold">{job._count.applications}</p>
                      <p className="text-xs text-muted-foreground">Applicants</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{job.viewCount}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
