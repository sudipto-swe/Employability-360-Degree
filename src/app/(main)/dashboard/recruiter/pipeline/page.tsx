import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Kanban, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PipelineKanban, type PipelineApplication } from "@/components/dashboard/PipelineKanban";

export const metadata: Metadata = {
  title: "Hiring Pipeline",
};

export default async function PipelinePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/dashboard");
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Fetch all applications for jobs owned by this recruiter
  const applications = profile ? await prisma.application.findMany({
    where: {
      job: {
        recruiterId: profile.id,
      },
      status: {
        in: ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"], // Exclude rejected/hired for the main pipeline view
      },
    },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      jobSeeker: {
        select: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      job: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      appliedAt: "desc",
    },
  }) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Kanban className="w-6 h-6 text-primary" />
          Hiring Pipeline
        </h1>
        <p className="text-muted-foreground mt-1">
          Drag and drop candidates between stages to track your hiring progress.
        </p>
      </div>

      <PipelineKanban initialApplications={applications as unknown as PipelineApplication[]} />

      {/* Tip */}
      <Card className="bg-primary/5 border-primary/20 py-4 mt-6">
        <CardContent className="pt-0 flex items-center gap-3 mb-0 pb-0">
          <ChevronRight className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span>{" "}
            Candidates will appear here as you receive applications. Update their status by dragging them between columns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
