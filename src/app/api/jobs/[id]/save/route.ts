/**
 * Saved Jobs API
 *
 * POST   /api/jobs/[id]/save — Save/unsave a job
 * GET    /api/jobs/[id]/save — Check if job is saved
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    let profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      // Auto-create a basic profile to allow saving jobs
      profile = await prisma.jobSeekerProfile.create({
        data: {
          userId: session.user.id,
          parsedSkills: [],
        },
        select: { id: true }
      });
    }

    // Toggle — check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        jobSeekerId_jobId: {
          jobSeekerId: profile.id,
          jobId,
        },
      },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, saved: false });
    }

    await prisma.savedJob.create({
      data: { jobSeekerId: profile.id, jobId },
    });

    return NextResponse.json({ success: true, saved: true }, { status: 201 });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ saved: false });
    }

    const { id: jobId } = await params;

    let profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ saved: false });
    }

    const existing = await prisma.savedJob.findUnique({
      where: {
        jobSeekerId_jobId: {
          jobSeekerId: profile.id,
          jobId,
        },
      },
    });

    return NextResponse.json({ saved: !!existing });
  } catch {
    return NextResponse.json({ saved: false });
  }
}
