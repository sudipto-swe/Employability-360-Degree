/**
 * Applications API
 * 
 * POST /api/jobs/[id]/apply → Apply to a job (jobseeker only)
 * GET  /api/jobs/[id]/apply → Get application status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST — Apply to a job */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "Only job seekers can apply" },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;
    const body = await request.json().catch(() => ({}));
    const coverLetter = body.coverLetter || null;

    // Check job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, isActive: true, deadline: true },
    });

    if (!job || !job.isActive) {
      return NextResponse.json(
        { error: "Job not found or no longer active" },
        { status: 404 }
      );
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Application deadline has passed" },
        { status: 400 }
      );
    }

    // Get jobseeker profile (Application references jobSeekerId, not userId)
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, resumeUrl: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your profile before applying." },
        { status: 400 }
      );
    }

    // Check for existing application (unique constraint: jobId + jobSeekerId)
    const existing = await prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId: profile.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        jobSeekerId: profile.id,
        coverLetter,
        resumeUrl: profile.resumeUrl || null,
        status: "APPLIED",
      },
    });

    // Increment application count on job
    await prisma.job.update({
      where: { id: jobId },
      data: { applicationCount: { increment: 1 } },
    });

    return NextResponse.json(
      { success: true, data: application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET — Check application status */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    // Look up via the jobseeker profile
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ success: true, data: null, hasApplied: false });
    }

    const application = await prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId,
          jobSeekerId: profile.id,
        },
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        coverLetter: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: application,
      hasApplied: !!application,
    });
  } catch (error) {
    console.error("Check application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
