import { prisma } from "@/lib/prisma";

export const TIER_LIMITS = {
  FREE: { ai: 5, jobs: 1 },
  SILVER: { ai: 25, jobs: 5 },
  GOLD: { ai: 50, jobs: 10 },
  PLATINUM: { ai: 100, jobs: 20 },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export function getUserTierAndLimits(user: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}) {
  const isExpired = user.subscriptionExpiresAt
    ? new Date() > new Date(user.subscriptionExpiresAt)
    : false;
  const rawTier = user.subscriptionTier?.toUpperCase() as SubscriptionTier;
  const tier: SubscriptionTier =
    isExpired || !TIER_LIMITS[rawTier] ? "FREE" : rawTier;

  return {
    tier,
    limits: TIER_LIMITS[tier] || TIER_LIMITS.FREE,
  };
}

export async function checkAndIncrementAiUsage(userId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  tier: SubscriptionTier;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true, aiUsageCount: true },
  });

  if (!user) {
    return { allowed: false, count: 0, limit: 0, tier: "FREE" };
  }

  const { tier, limits } = getUserTierAndLimits(user);

  if (user.aiUsageCount >= limits.ai) {
    return {
      allowed: false,
      count: user.aiUsageCount,
      limit: limits.ai,
      tier,
    };
  }

  // Increment usage count
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      aiUsageCount: {
        increment: 1,
      },
    },
    select: { aiUsageCount: true },
  });

  return {
    allowed: true,
    count: updatedUser.aiUsageCount,
    limit: limits.ai,
    tier,
  };
}

export async function checkJobPostLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  tier: SubscriptionTier;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      recruiterProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || !user.recruiterProfile) {
    return { allowed: false, count: 0, limit: 0, tier: "FREE" };
  }

  const { tier, limits } = getUserTierAndLimits(user);
  const currentJobCount = await prisma.job.count({
    where: { recruiterId: user.recruiterProfile.id },
  });

  if (currentJobCount >= limits.jobs) {
    return {
      allowed: false,
      count: currentJobCount,
      limit: limits.jobs,
      tier,
    };
  }

  return {
    allowed: true,
    count: currentJobCount,
    limit: limits.jobs,
    tier,
  };
}
