import { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { JobCardMatch } from "@/components/jobs/JobCardMatch";

export const metadata: Metadata = {
  title: "Browse Jobs",
  description: "Find your next career opportunity in Bangladesh. Browse thousands of AI-matched job listings.",
};

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "Negotiable";
  const fmt = (n: number) => `৳${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function locationTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "remote": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "hybrid": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default: return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }
}

export default async function JobsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  
  // Extract query params
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const location = typeof searchParams.location === "string" ? searchParams.location : undefined;
  const category = typeof searchParams.category === "string" && searchParams.category !== "all" ? searchParams.category : undefined;
  const jobType = typeof searchParams.jobType === "string" && searchParams.jobType !== "all" ? searchParams.jobType : undefined;
  const locationType = typeof searchParams.locationType === "string" && searchParams.locationType !== "all" ? searchParams.locationType : undefined;
  const experienceLevel = typeof searchParams.experienceLevel === "string" && searchParams.experienceLevel !== "all" ? searchParams.experienceLevel : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest";

  // Build Prisma where clause
  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { skills: { array_contains: search } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (category) where.categoryId = category;
  if (locationType) where.locationType = locationType;
  if (jobType) where.jobType = jobType;
  if (experienceLevel) where.experienceLevel = experienceLevel;

  // Build order clause
  let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (sort === "salary-high") {
    orderBy = [{ salaryMax: "desc" }, { salaryMin: "desc" }];
  } else if (sort === "salary-low") {
    orderBy = [{ salaryMin: "asc" }, { salaryMax: "asc" }];
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      recruiter: {
        select: {
          companyName: true,
          companyLogo: true,
        },
      },
    },
    orderBy,
    take: 50, // Limit for now
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  // Fetch user skills for match scoring
  let userSkills: string[] = [];
  if (session?.user?.id) {
    const seekerProfile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { parsedSkills: true },
    });
    if (seekerProfile?.parsedSkills && Array.isArray(seekerProfile.parsedSkills)) {
      userSkills = seekerProfile.parsedSkills as string[];
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
              {session?.user ? (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="gradient-brand text-white border-0">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <form action="/jobs" method="GET">
        {/* Search header */}
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              Browse <span className="text-gradient">Jobs</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={search}
                  placeholder="Job title, skill, or company..."
                  className="pl-10 h-11"
                />
              </div>
              <div className="sm:w-48 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  name="location"
                  defaultValue={location}
                  placeholder="Location..."
                  className="pl-10 h-11"
                />
              </div>
              <Button type="submit" className="gradient-brand text-white border-0 h-11 px-6">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h2>
                  <Link href="/jobs">
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      Clear all
                    </Button>
                  </Link>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Category</h3>
                  <Select name="category" defaultValue={category || "all"}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Job Type */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Job Type</h3>
                  <Select name="jobType" defaultValue={jobType || "all"}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="fulltime">Full-time</SelectItem>
                      <SelectItem value="parttime">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Type */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Work Mode</h3>
                  <Select name="locationType" defaultValue={locationType || "all"}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All modes</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Experience</h3>
                  <Select name="experienceLevel" defaultValue={experienceLevel || "all"}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead / Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" variant="secondary" className="w-full">
                  Apply Filters
                </Button>
              </div>
            </aside>

            {/* Job listings */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{jobs.length}</span> jobs
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select name="sort" defaultValue={sort}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="salary-high">Highest Salary</SelectItem>
                      <SelectItem value="salary-low">Lowest Salary</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="outline" size="sm" className="h-9 hidden md:flex">
                    Sort
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-12 border rounded-xl bg-card">
                    <h3 className="font-medium">No jobs found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="group hover-lift cursor-pointer py-5 transition-all hover:border-primary/20">
                        <CardContent className="pt-0">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Company avatar */}
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {job.recruiter.companyLogo ? (
                                <img src={job.recruiter.companyLogo} alt={job.recruiter.companyName} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Job info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                                      {job.title}
                                    </h3>
                                    {job.isFeatured && (
                                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5 py-0 h-5">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {job.recruiter.companyName}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-primary whitespace-nowrap">
                                  {formatSalary(job.salaryMin, job.salaryMax)}
                                </p>
                              </div>
                              {/* Circular Match Score */}
                              {userSkills.length > 0 && Array.isArray(job.skills) && (job.skills as string[]).length > 0 && (
                                <div className="hidden sm:flex items-center">
                                  <JobCardMatch
                                    jobSkills={job.skills as string[]}
                                    userSkills={userSkills}
                                  />
                                </div>
                              )}

                              {/* Meta */}
                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-2 py-0.5 border-0 ${locationTypeColor(job.locationType)}`}
                                >
                                  {job.locationType}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                                  {job.jobType}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Skills */}
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                {Array.isArray(job.skills) && (job.skills as string[]).slice(0, 4).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-[10px] px-2 py-0.5 bg-muted font-normal"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {Array.isArray(job.skills) && (job.skills as string[]).length > 4 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{(job.skills as string[]).length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
