import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Globe,
  Users,
  CalendarDays,
  ArrowLeft,
  Share2,
  Bookmark,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ApplyButton } from "./apply-button";
import { SaveJobButton } from "./save-job-button";
import { AIMatchButton } from "./ai-match-button";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    select: { title: true, recruiter: { select: { companyName: true } } },
  });

  if (!job) return { title: "Job Not Found" };

  return {
    title: `${job.title} at ${job.recruiter.companyName}`,
    description: `Apply for ${job.title} at ${job.recruiter.companyName} on Employability 360°`,
  };
}

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "Negotiable";
  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} / month`;
  if (min) return `From ${fmt(min)} / month`;
  return `Up to ${fmt(max!)} / month`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" });
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      recruiter: {
        select: {
          companyName: true,
          companyLogo: true,
          industry: true,
          companySize: true,
          companyWebsite: true,
        },
      },
      category: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  // Increment view count (fire-and-forget)
  prisma.job.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Check if saved
  let hasSaved = false;
  const session = await auth();
  if (session?.user?.id) {
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });
    if (profile) {
      const saved = await prisma.savedJob.findUnique({
        where: { jobSeekerId_jobId: { jobSeekerId: profile.id, jobId: id } }
      });
      hasSaved = !!saved;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Employability <span className="text-gradient">360°</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gradient-brand text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Job header */}
            <Card className="py-6">
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">{job.title}</h1>
                        <p className="text-muted-foreground mt-1">
                          {job.recruiter.companyName}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <SaveJobButton jobId={job.id} initialSaved={hasSaved} />
                        <Button variant="outline" size="icon">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </Badge>
                      <Badge variant="outline">{job.locationType}</Badge>
                      <Badge variant="outline">{job.jobType}</Badge>
                      {job.experienceLevel && (
                        <Badge variant="outline">{job.experienceLevel} level</Badge>
                      )}
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(job.createdAt)}
                      </Badge>
                    </div>

                    <p className="text-lg font-semibold text-primary mt-4">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="py-6">
              <CardHeader className="pt-0 pb-4">
                <CardTitle className="text-lg">Job Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card className="py-6">
                <CardHeader className="pt-0 pb-4">
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card className="py-6">
                <CardHeader className="pt-0 pb-4">
                  <CardTitle className="text-lg">Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {job.responsibilities}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <Card className="py-6">
                <CardHeader className="pt-0 pb-4">
                  <CardTitle className="text-lg">Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {(job.skills as string[]).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-1.5 text-primary" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {Array.isArray(job.benefits) && job.benefits.length > 0 && (
              <Card className="py-6">
                <CardHeader className="pt-0 pb-4">
                  <CardTitle className="text-lg">Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {(job.benefits as string[]).map((benefit: string) => (
                      <Badge key={benefit} variant="outline" className="px-3 py-1">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-6">
            {/* Apply card */}
            <Card className="lg:sticky lg:top-24 py-6">
              <CardContent className="space-y-4 pt-0">
                <ApplyButton jobId={job.id} />
                <AIMatchButton jobId={job.id} />

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Applicants</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {job._count.applications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Posted</span>
                    <span className="font-medium flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {timeAgo(job.createdAt)}
                    </span>
                  </div>
                  {job.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium text-destructive">
                        {new Date(job.deadline).toLocaleDateString("en-BD", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {job.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{job.category.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company card */}
            <Card className="py-6">
              <CardHeader className="pt-0 pb-4">
                <CardTitle className="text-base">About the Company</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{job.recruiter.companyName}</p>
                    {job.recruiter.industry && (
                      <p className="text-xs text-muted-foreground">{job.recruiter.industry}</p>
                    )}
                  </div>
                </div>

                {job.recruiter.companySize && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{job.recruiter.companySize} employees</span>
                  </div>
                )}

                {job.recruiter.companyWebsite && (
                  <a
                    href={job.recruiter.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
