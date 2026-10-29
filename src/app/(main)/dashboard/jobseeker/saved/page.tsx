import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { SaveJobButton } from "@/app/(main)/jobs/[id]/save-job-button";
import { JobCardMatch } from "@/components/jobs/JobCardMatch";

export const metadata: Metadata = {
  title: "Saved Jobs",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "Negotiable";
  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default async function SavedJobsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "JOBSEEKER") {
    redirect("/dashboard");
  }

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, parsedSkills: true },
  });

  const userSkills: string[] = profile?.parsedSkills && Array.isArray(profile.parsedSkills)
    ? (profile.parsedSkills as string[])
    : [];

  const savedJobs = profile
    ? await prisma.savedJob.findMany({
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
              isActive: true,
              skills: true,
              createdAt: true,
              recruiter: {
                select: { companyName: true },
              },
            },
          },
        },
        orderBy: { savedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" />
          Saved Jobs
        </h1>
        <p className="text-muted-foreground mt-1">
          Jobs you&apos;ve bookmarked for later.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-0">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No saved jobs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse jobs and save the ones that interest you.
            </p>
            <Link href="/jobs">
              <Button className="gradient-brand text-white border-0">
                Browse Jobs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((saved) => (
            <Card
              key={saved.id}
              className="py-4 hover:border-primary/20 transition-all"
            >
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${saved.job.id}`}
                        className="font-semibold text-sm hover:text-primary transition-colors truncate"
                      >
                        {saved.job.title}
                      </Link>
                      {!saved.job.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {saved.job.recruiter.companyName}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {saved.job.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3" />
                        {saved.job.jobType}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {formatSalary(saved.job.salaryMin, saved.job.salaryMax)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {userSkills.length > 0 && Array.isArray(saved.job.skills) && (saved.job.skills as string[]).length > 0 && (
                      <JobCardMatch
                        jobSkills={saved.job.skills as string[]}
                        userSkills={userSkills}
                      />
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                      <Clock className="w-3 h-3" />
                      {timeAgo(saved.savedAt)}
                    </span>
                    <SaveJobButton jobId={saved.job.id} initialSaved={true} />
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
