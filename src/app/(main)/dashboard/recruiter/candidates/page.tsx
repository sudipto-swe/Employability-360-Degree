import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  MapPin,
  Star,
  FileText,
  Clock,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";
import { CandidateDetailModal } from "@/components/dashboard/CandidateDetailModal";

export const metadata: Metadata = {
  title: "Candidates",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    APPLIED: "bg-blue-100 text-blue-700",
    SCREENING: "bg-amber-100 text-amber-700",
    INTERVIEW: "bg-violet-100 text-violet-700",
    OFFER: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

export default async function CandidatesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/dashboard");
  }

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });

  const applications = recruiterProfile
    ? await prisma.application.findMany({
        where: {
          job: { recruiterId: recruiterProfile.id },
        },
        include: {
          job: { select: { title: true } },
          jobSeeker: {
            select: {
              userId: true,
              headline: true,
              summary: true,
              location: true,
              expectedSalary: true,
              parsedSkills: true,
              experience: true,
              education: true,
              resumeUrl: true,
              user: { select: { name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage all applicants across your job listings.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {applications.length} total
        </Badge>
      </div>

      {applications.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center pt-0">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No applicants yet</h3>
            <p className="text-sm text-muted-foreground">
              Applicants will appear here once people apply to your jobs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const skills = (app.jobSeeker.parsedSkills as string[] | null) || [];
            const initials = (app.jobSeeker.user.name || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={app.id} className="py-4 hover:border-primary/20 transition-colors">
                <CardContent className="pt-0">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{app.jobSeeker.user.name}</h3>
                        <Badge className={`text-[10px] border-0 ${statusBadge(app.status)}`}>
                          {app.status}
                        </Badge>
                        {app.matchScore && app.matchScore > 0.8 && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                            <Star className="w-3 h-3 mr-0.5" />
                            Top Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {app.jobSeeker.headline || app.jobSeeker.user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Applied to: <span className="font-medium text-foreground">{app.job.title}</span>
                        </span>
                        {app.jobSeeker.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {app.jobSeeker.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(app.appliedAt)}
                        </span>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-[10px]">
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 5 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{skills.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <CandidateDetailModal
                        candidate={app.jobSeeker}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
