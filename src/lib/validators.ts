/**
 * Zod Validation Schemas
 * 
 * Shared between client forms and server API routes
 * for consistent, typed validation.
 */

import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["JOBSEEKER", "RECRUITER"]),
});

// ─── Jobs ─────────────────────────────────────────────────

export const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  locationType: z.enum(["onsite", "remote", "hybrid"]).default("onsite"),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.string().default("BDT"),
  jobType: z
    .enum(["fulltime", "parttime", "contract", "internship"])
    .default("fulltime"),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead"]).optional(),
  skills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  deadline: z.string().datetime().optional(),
});

export const jobFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(["onsite", "remote", "hybrid"]).optional(),
  jobType: z
    .enum(["fulltime", "parttime", "contract", "internship"])
    .optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead"]).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
});

// ─── Applications ─────────────────────────────────────────

export const applyJobSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum([
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
  ]),
  notes: z.string().optional(),
});

// ─── CV Builder ───────────────────────────────────────────

export const cvContentSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
    summary: z.string().optional(),
  }),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean().default(false),
        description: z.string().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        location: z.string().optional(),
        year: z.string(),
        gpa: z.string().optional(),
      })
    )
    .optional(),
  skills: z.array(z.string()).optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        year: z.string().optional(),
      })
    )
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.string(),
      })
    )
    .optional(),
});

// ─── Messages ─────────────────────────────────────────────

export const sendMessageSchema = z.object({
  receiverId: z.string(),
  applicationId: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty"),
});

// ─── Type exports ─────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CVContentInput = z.infer<typeof cvContentSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
