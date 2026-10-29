/**
 * AI Resume Parser API
 *
 * POST /api/ai/parse-resume — Parse resume text and return structured data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseResume, parseResumePdf } from "@/lib/ai/gemini";
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
    const { resumeText, resumeUrl } = body;

    if (!resumeUrl && (!resumeText || resumeText.trim().length < 50)) {
      return NextResponse.json(
        { error: "Resume text or resumeUrl is required." },
        { status: 400 }
      );
    }

    let parsed;
    if (resumeUrl) {
      const response = await fetch(resumeUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch resume file from storage");
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      parsed = await parseResumePdf(buffer);
    } else {
      parsed = await parseResume(resumeText);
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume. Please try a different format." },
      { status: 500 }
    );
  }
}
