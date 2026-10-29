import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visitedUserId } = await request.json();
    if (!visitedUserId) {
      return NextResponse.json({ error: "visitedUserId is required" }, { status: 400 });
    }

    const visitorId = session.user.id;

    // Do not log self-visits
    if (visitorId === visitedUserId) {
      return NextResponse.json({ success: true, message: "Self visit not logged" });
    }

    // Log the visit in ProfileVisit table
    await prisma.profileVisit.create({
      data: {
        visitorId,
        visitedId: visitedUserId,
      },
    });

    // Increment profileViews if the visited user is a Jobseeker
    const jobseeker = await prisma.jobSeekerProfile.findUnique({
      where: { userId: visitedUserId },
    });

    if (jobseeker) {
      await prisma.jobSeekerProfile.update({
        where: { id: jobseeker.id },
        data: {
          profileViews: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging profile visit:", error);
    return NextResponse.json({ error: error.message || "Failed to log visit" }, { status: 500 });
  }
}
