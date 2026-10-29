import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { sendEmail } from "@/lib/emails/resend";
import { ApplicationStatusEmail } from "@/lib/emails/templates/ApplicationStatusEmail";

const updateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "RECRUITER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Verify the application belongs to a job posted by this recruiter
    const application = await prisma.application.findUnique({
      where: { id },
      include: { 
        job: {
          include: {
            recruiter: true,
          }
        },
        jobSeeker: {
          include: {
            user: true,
          }
        }
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.job.recruiterId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this application" },
        { status: 403 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Send email asynchronously
    if (application.jobSeeker.user.email) {
      sendEmail({
        to: application.jobSeeker.user.email,
        subject: `Update on your application for ${application.job.title}`,
        react: ApplicationStatusEmail({
          jobSeekerName: application.jobSeeker.user.name || "Candidate",
          companyName: application.job.recruiter.companyName || "the company",
          jobTitle: application.job.title,
          status,
        }),
      }).catch(console.error);
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[APPLICATION_STATUS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
