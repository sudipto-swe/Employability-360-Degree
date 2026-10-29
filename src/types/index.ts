/**
 * Shared TypeScript Types
 */

// Re-export Zod inferred types
export type {
  LoginInput,
  RegisterInput,
  CreateJobInput,
  JobFilterInput,
  ApplyJobInput,
  UpdateApplicationInput,
  CVContentInput,
  SendMessageInput,
} from "@/lib/validators";

// ─── API Response Types ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Job Types ────────────────────────────────────────────

export interface JobWithRecruiter {
  id: string;
  title: string;
  description: string;
  location: string;
  locationType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  jobType: string;
  experienceLevel: string | null;
  skills: string[] | null;
  isActive: boolean;
  isFeatured: boolean;
  applicationCount: number;
  deadline: Date | null;
  createdAt: Date;
  category: { name: string; slug: string } | null;
  recruiter: {
    companyName: string;
    companyLogo: string | null;
    industry: string | null;
  };
}

// ─── Match Result ─────────────────────────────────────────

export interface MatchResult {
  jobId: string;
  title: string;
  companyName: string;
  matchScore: number; // 0.0 - 1.0
  location: string;
  jobType: string;
}

// ─── Interview Types ──────────────────────────────────────

export interface InterviewQuestion {
  question: string;
  category: string; // "behavioral" | "technical" | "situational"
  difficulty: string; // "easy" | "medium" | "hard"
}

export interface InterviewAnswer {
  questionIndex: number;
  answer: string;
  score: number; // 0-100
  feedback: string;
}
