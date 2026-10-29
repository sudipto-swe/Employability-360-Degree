/**
 * Profile API
 * 
 * PATCH /api/profile — Update job seeker profile
 * GET   /api/profile — Get current user's profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET — Get current user profile */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "JOBSEEKER") {
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ success: true, data: profile });
    }

    if (session.user.role === "RECRUITER") {
      const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ success: true, data: profile });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** PATCH — Update profile */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (session.user.role === "JOBSEEKER") {
      const profile = await prisma.jobSeekerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          headline: body.headline,
          summary: body.summary,
          location: body.location,
          expectedSalary: body.expectedSalary,
          isOpenToWork: body.isOpenToWork,
          parsedSkills: body.parsedSkills,
          resumeUrl: body.resumeUrl,
        },
        create: {
          userId: session.user.id,
          headline: body.headline,
          summary: body.summary,
          location: body.location,
          expectedSalary: body.expectedSalary,
          isOpenToWork: body.isOpenToWork ?? true,
          parsedSkills: body.parsedSkills,
          resumeUrl: body.resumeUrl,
        },
      });

      return NextResponse.json({ success: true, data: profile });
    }

    if (session.user.role === "RECRUITER") {
      const profile = await prisma.recruiterProfile.upsert({
        where: { userId: session.user.id },
        update: {
          companyName: body.companyName,
          companyDescription: body.companyDescription,
          companyWebsite: body.companyWebsite,
          industry: body.industry,
          companySize: body.companySize,
        },
        create: {
          userId: session.user.id,
          companyName: body.companyName || "My Company",
          companyDescription: body.companyDescription,
          companyWebsite: body.companyWebsite,
          industry: body.industry,
          companySize: body.companySize,
        },
      });

      return NextResponse.json({ success: true, data: profile });
    }

    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
