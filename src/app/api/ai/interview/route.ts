/**
 * AI Interview Coach API
 *
 * POST /api/ai/interview — Generate interview questions
 * POST /api/ai/interview/evaluate — Evaluate an answer
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInterviewQuestions } from "@/lib/ai/gemini";
import { checkAndIncrementAiUsage } from "@/lib/ai/limits";

/** POST — Generate interview questions */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = await checkAndIncrementAiUsage(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limit exceeded. Your current tier is ${limitCheck.tier} which only allows ${limitCheck.limit} AI calls. Please upgrade your plan.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobTitle, skills = [], difficulty = "medium", count = 5, depth = "conceptual" } = body;

    if (!jobTitle) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }

    const questions = await generateInterviewQuestions(
      jobTitle,
      skills,
      difficulty,
      Math.min(count, 10),
      depth
    );

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Interview generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview questions. Please try again." },
      { status: 500 }
    );
  }
}
