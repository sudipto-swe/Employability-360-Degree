/**
 * Registration API Route
 * 
 * POST /api/auth/register
 * Creates a new user with hashed password and role-specific profile.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/emails/resend";
import { WelcomeEmail } from "@/lib/emails/templates/WelcomeEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with role-specific profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      // Create role-specific profile
      if (role === "JOBSEEKER") {
        await tx.jobSeekerProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      } else if (role === "RECRUITER") {
        await tx.recruiterProfile.create({
          data: {
            userId: newUser.id,
            companyName: "", // Will be filled in onboarding
          },
        });
      }

      return newUser;
    });

    // Send welcome email asynchronously (fire and forget)
    sendEmail({
      to: user.email,
      subject: "Welcome to Employability 360°",
      react: WelcomeEmail({
        name: user.name || "User",
        role: user.role === "JOBSEEKER" ? "JOB_SEEKER" : "RECRUITER",
      }),
    }).catch(console.error);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
