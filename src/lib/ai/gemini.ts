/**
 * Gemini AI Client (Refactored to route text generation via Unified Fallback Client)
 * 
 * Wrapper around Google Generative AI SDK / Groq Client for:
 * - Resume parsing (extracting structured data from CV text)
 * - CV content generation (creating professional bullet points)
 * - Interview question generation & answer evaluation
 * - Text embedding generation (for vector similarity matching)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateText, generateJson } from "./client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/** Get embedding model for vector similarity */
function getEmbeddingModel() {
  return genAI.getGenerativeModel({ model: "text-embedding-004" });
}

// ─── Resume Parsing ───────────────────────────────────────

export async function parseResume(resumeText: string) {
  const prompt = `You are an expert resume parser. Extract structured information from the following resume text and return it as a valid JSON object with the following schema. Do NOT include any markdown formatting, code blocks, or explanation — return ONLY the raw JSON.

Schema:
{
  "personalInfo": {
    "fullName": string,
    "email": string,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "website": string | null,
    "summary": string | null
  },
  "experience": [
    {
      "title": string,
      "company": string,
      "location": string | null,
      "startDate": string,
      "endDate": string | null,
      "current": boolean,
      "description": string | null
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "location": string | null,
      "year": string,
      "gpa": string | null
    }
  ],
  "skills": string[],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "year": string | null
    }
  ],
  "languages": [
    {
      "name": string,
      "proficiency": string
    }
  ]
}

Resume text:
"""
${resumeText}
"""`;

  try {
    return await generateJson(prompt, { maxTokens: 4096 });
  } catch (err) {
    console.error("Failed to parse resume JSON:", err);
    throw new Error("AI could not parse the resume. Please try a different format.");
  }
}

export async function parseResumePdf(pdfBuffer: Buffer) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are an expert resume parser. Extract structured information from this resume PDF and return it as a valid JSON object with the following schema. Do NOT include any markdown formatting, code blocks, or explanation — return ONLY the raw JSON.

Schema:
{
  "personalInfo": {
    "fullName": string,
    "email": string,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "website": string | null,
    "summary": string | null
  },
  "experience": [
    {
      "title": string,
      "company": string,
      "location": string | null,
      "startDate": string,
      "endDate": string | null,
      "current": boolean,
      "description": string | null
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "location": string | null,
      "year": string,
      "gpa": string | null
    }
  ],
  "skills": string[],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "year": string | null
    }
  ],
  "languages": [
    {
      "name": string,
      "proficiency": string
    }
  ]
}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf"
        }
      },
      prompt
    ]);
    const responseText = result.response.text().trim();
    const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse resume PDF:", err);
    throw new Error("AI could not parse the resume. Please make sure it is a valid PDF and try again.");
  }
}

// ─── CV Content Generation ────────────────────────────────

export async function generateCVContent(
  section: string,
  context: {
    jobTitle?: string;
    company?: string;
    skills?: string[];
    description?: string;
  }
) {
  const prompt = `You are a professional CV writer specializing in the Bangladesh job market. Generate a compelling ${section} section based on the following context. Write in professional English. Return ONLY the text content, no formatting wrappers.

Context:
- Job Title: ${context.jobTitle || "Not specified"}
- Company: ${context.company || "Not specified"}
- Skills: ${context.skills?.join(", ") || "Not specified"}
- Additional Context: ${context.description || "None"}

Generate a professional, ATS-friendly ${section} that highlights achievements with quantifiable metrics where possible.`;

  return await generateText(prompt);
}

// ─── Interview Questions ──────────────────────────────────

export async function generateInterviewQuestions(
  jobTitle: string,
  skills: string[],
  difficulty: "easy" | "medium" | "hard" = "medium",
  count: number = 5,
  depth: string = "conceptual"
) {
  let depthInstructions = "";
  if (depth === "coding") {
    depthInstructions = "Focus on coding questions, syntax, algorithm design, and code optimization.";
  } else if (depth === "system-design") {
    depthInstructions = "Focus on system design, scalability, database design, and real-world system architecture.";
  } else if (depth === "behavioral") {
    depthInstructions = "Focus on behavioral scenarios, project experience, conflict resolution, and leadership skills.";
  } else {
    depthInstructions = "Focus on fundamental concepts, theory, and core domain knowledge.";
  }

  const prompt = `You are an expert interview coach for the Bangladesh job market. Generate ${count} interview questions for a "${jobTitle}" position requiring skills: ${skills.join(", ")}.

Difficulty level: ${difficulty}
Question depth focus: ${depthInstructions}

Return a valid JSON array of objects with this schema. Return ONLY the JSON, no markdown or explanation:
[
  {
    "question": string,
    "category": "behavioral" | "technical" | "situational",
    "difficulty": "${difficulty}",
    "tips": string (1-2 sentence hint for the candidate)
  }
]`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error("Failed to parse interview questions:", err);
    throw new Error("Failed to generate questions. Please try again.");
  }
}

// ─── Interview Answer Evaluation ──────────────────────────

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  jobTitle: string
) {
  const prompt = `You are an expert interview coach. Evaluate the following interview answer for a "${jobTitle}" position.

Question: "${question}"
Answer: "${answer}"

Provide a JSON response with ONLY the following schema. No markdown or explanation:
{
  "score": number (0-100),
  "feedback": string (2-3 sentences of constructive feedback),
  "strengths": string[] (1-3 strengths),
  "improvements": string[] (1-3 areas to improve),
  "sampleAnswer": string (a strong example answer, 2-3 sentences)
}`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error("Failed to parse evaluation:", err);
    throw new Error("Failed to evaluate answer. Please try again.");
  }
}

// ─── Embedding Generation ─────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/** Generate embedding for a job posting (title + description + skills) */
export async function generateJobEmbedding(job: {
  title: string;
  description: string;
  skills?: string[];
}) {
  const text = `${job.title}\n${job.description}\nSkills: ${job.skills?.join(", ") || ""}`;
  return generateEmbedding(text.slice(0, 2048)); // Limit to 2K chars
}

/** Generate embedding for a candidate profile */
export async function generateProfileEmbedding(profile: {
  title?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
}) {
  const text = `${profile.title || ""}\n${profile.summary || ""}\nSkills: ${profile.skills?.join(", ") || ""}\n${profile.experience || ""}`;
  return generateEmbedding(text.slice(0, 2048));
}

// ─── AI Job Matcher ───────────────────────────────────────

export async function evaluateJobMatch(
  jobDescription: string,
  userProfile: any
) {
  const prompt = `You are an expert ATS and recruitment AI. Compare the following Candidate Profile with the Job Description.

Job Description:
"""
${jobDescription}
"""

Candidate Profile:
"""
${JSON.stringify(userProfile)}
"""

Evaluate how well the candidate matches the job. Return ONLY a valid JSON object with no markdown wrappers or extra text. Use this schema:
{
  "matchPercentage": number (0-100),
  "analysis": string (2-3 sentences explaining why they match or what is missing),
  "missingSkills": string[] (up to 5 missing skills)
}`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error("Failed to parse match evaluation:", err);
    throw new Error("Failed to evaluate match. Please try again.");
  }
}
