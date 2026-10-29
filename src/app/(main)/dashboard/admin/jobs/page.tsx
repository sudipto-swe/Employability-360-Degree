import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Building2,
  Eye,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage Jobs",
};

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      recruiter: { select: { companyName: true } },
      _count: { select: { applications: true } },
    },
  });

  const activeCount = jobs.filter((j) => j.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Job Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Moderate and manage all job listings on the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {activeCount} Active
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {jobs.length - activeCount} Inactive
          </Badge>
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-0">
            <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No jobs posted yet</h3>
            <p className="text-sm text-muted-foreground">Jobs will appear here as recruiters create them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="py-4 hover:border-primary/20 transition-colors">
              <CardContent className="pt-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <Badge variant={job.isActive ? "default" : "secondary"} className="text-[10px]">
                        {job.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {job.isFeatured && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Featured</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{job.recruiter.companyName}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {job.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {job._count.applications} applicants
                      </span>
                      <span>
                        {new Date(job.createdAt).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
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
