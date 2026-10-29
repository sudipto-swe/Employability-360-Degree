import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateText } from "@/lib/ai/client";
import { checkAndIncrementAiUsage } from "@/lib/ai/limits";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const limitCheck = await checkAndIncrementAiUsage(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limit exceeded. Your current tier is ${limitCheck.tier} which only allows ${limitCheck.limit} AI calls. Please upgrade your plan.` },
        { status: 403 }
      );
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid request: messages array is required", { status: 400 });
    }

    const systemPrompt = `You are a virtual career assistant for "Employability 360°", a leading AI-powered job portal and CV builder platform tailored for Bangladesh.
Your goal is to help candidates (job seekers) and recruiters.
- Provide expert career advice, resume building guidelines, job search tips, and mock interview prep.
- Understand the context of Bangladesh: highlight local top universities (like BUET, DU, NSU, BRAC, etc.), tech hubs, local industries, and typical hiring standards in Bangladesh.
- Be polite, encouraging, professional, and clear.
- Support both English and Bengali (Bangla) depending on the language the user uses. If they talk in Bangla, reply in Bangla. If they talk in English, reply in English.
- Keep answers concise, actionable, and formatted nicely with bullet points where appropriate.`;

    // Format conversation history
    const conversationText = messages
      .slice(-10) // Limit to last 10 messages to keep prompts reasonable
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const latestPrompt = `${conversationText}\nAssistant:`;

    const response = await generateText(latestPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1024,
      ttlSeconds: 3600, // Cache chatbot answers for 1 hour
    });

    return NextResponse.json({ content: response });
  } catch (err: any) {
    console.error("Chatbot API Error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
