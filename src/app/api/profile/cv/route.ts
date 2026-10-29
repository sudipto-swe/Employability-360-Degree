/**
 * Job Seeker CV Save API
 * 
 * POST /api/profile/cv — Save CV JSON data to JobSeekerProfile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "JOBSEEKER") {
      return NextResponse.json(
        { error: "Only job seekers can save CVs" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        parsedData: body, // Save the entire CV object
        parsedSkills: body.skills,
        experience: body.experiences,
        education: body.education,
      },
      create: {
        userId: session.user.id,
        parsedData: body,
        parsedSkills: body.skills,
        experience: body.experiences,
        education: body.education,
      },
    });

    return NextResponse.json(
      { success: true, data: profile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save CV error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
