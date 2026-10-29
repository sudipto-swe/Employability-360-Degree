import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateJobMatch } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Fetch the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch the job seeker profile
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Please complete your Job Seeker profile or build your CV first to calculate your AI match score." }, { status: 404 });
    }

    // Prefer parsedData (CV) if available, otherwise fallback to summary/parsedSkills
    const userProfileData = profile.parsedData || {
      bio: profile.summary,
      skills: profile.parsedSkills,
      experience: profile.experience,
      education: profile.education,
    };

    const jobDescription = `
      Title: ${job.title}
      Type: ${job.jobType}
      Description: ${job.description}
      Skills Required: ${Array.isArray(job.skills) ? (job.skills as string[]).join(", ") : ""}
      Experience Level: ${job.experienceLevel}
    `;

    const matchResult = await evaluateJobMatch(jobDescription, userProfileData);

    return NextResponse.json({ success: true, matchResult });
  } catch (error) {
    console.error("[JOB_MATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to evaluate job match. Please try again." },
      { status: 500 }
    );
  }
}
