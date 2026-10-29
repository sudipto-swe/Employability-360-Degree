/**
 * Jobs API — Create & List
 * 
 * POST /api/jobs  → Create a new job (recruiter only)
 * GET  /api/jobs  → List/search/filter jobs (public)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createJobSchema, jobFilterSchema } from "@/lib/validators";
import { checkJobPostLimit } from "@/lib/ai/limits";

/** POST — Create a job listing */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "RECRUITER") {
      return NextResponse.json(
        { error: "Only recruiters can post jobs" },
        { status: 403 }
      );
    }

    const limitCheck = await checkJobPostLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Job post limit reached. Your current tier is ${limitCheck.tier} which only allows posting ${limitCheck.limit} job(s). Please upgrade your subscription.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createJobSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiterProfile) {
      return NextResponse.json(
        { error: "Recruiter profile not found. Complete your profile first." },
        { status: 400 }
      );
    }

    const data = result.data;

    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        location: data.location,
        locationType: data.locationType,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        jobType: data.jobType,
        experienceLevel: data.experienceLevel,
        skills: data.skills || [],
        benefits: data.benefits || [],
        categoryId: data.categoryId,
        deadline: data.deadline ? new Date(data.deadline) : null,
        recruiterId: recruiterProfile.id,
      },
      include: {
        recruiter: {
          select: {
            companyName: true,
            companyLogo: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET — List/search/filter jobs */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = jobFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      location: searchParams.get("location") || undefined,
      locationType: searchParams.get("locationType") || undefined,
      jobType: searchParams.get("jobType") || undefined,
      experienceLevel: searchParams.get("experienceLevel") || undefined,
      salaryMin: searchParams.get("salaryMin")
        ? Number(searchParams.get("salaryMin"))
        : undefined,
      salaryMax: searchParams.get("salaryMax")
        ? Number(searchParams.get("salaryMax"))
        : undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 10,
    });

    if (!filters.success) {
      return NextResponse.json(
        { error: "Invalid filter parameters" },
        { status: 400 }
      );
    }

    const { search, category, location, locationType, jobType, experienceLevel, salaryMin, salaryMax, page, limit } = filters.data;

    // Build Prisma where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (locationType) where.locationType = locationType;
    if (jobType) where.jobType = jobType;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    if (category) {
      where.category = { slug: category };
    }

    if (salaryMin) {
      where.salaryMax = { gte: salaryMin };
    }
    if (salaryMax) {
      where.salaryMin = { lte: salaryMax };
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: where as never,
        include: {
          recruiter: {
            select: {
              companyName: true,
              companyLogo: true,
              industry: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.job.count({ where: where as never }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs.map((job) => ({
        ...job,
        applicationCount: job._count.applications,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
