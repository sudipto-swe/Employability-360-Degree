/**
 * AI Interview Answer Evaluation API
 *
 * POST /api/ai/interview/evaluate — Score and give feedback on an answer
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { evaluateInterviewAnswer } from "@/lib/ai/gemini";
import { checkAndIncrementAiUsage } from "@/lib/ai/limits";

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
    const { question, answer, jobTitle } = body;

    if (!question || !answer || !jobTitle) {
      return NextResponse.json(
        { error: "Question, answer, and job title are all required" },
        { status: 400 }
      );
    }

    const evaluation = await evaluateInterviewAnswer(question, answer, jobTitle);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer. Please try again." },
      { status: 500 }
    );
  }
}
