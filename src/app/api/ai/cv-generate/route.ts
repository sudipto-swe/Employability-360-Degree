/**
 * AI CV Content Generation API
 *
 * POST /api/ai/cv-generate — Generate a CV section with AI
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCVContent } from "@/lib/ai/gemini";
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
    const { section, context } = body;

    if (!section) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    const content = await generateCVContent(section, context || {});

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("CV generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
