/**
 * SSLCommerz Success Callback
 *
 * POST /api/payments/sslcommerz/success
 * Called by SSLCommerz when payment is successful.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { sendEmail } from "@/lib/emails/resend";
import { SubscriptionSuccessEmail } from "@/lib/emails/templates/SubscriptionSuccessEmail";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get("tran_id") as string;
    const valId = formData.get("val_id") as string;
    // const amount = formData.get("amount") as string;
    const status = formData.get("status") as string;

    if (status !== "VALID" && status !== "VALIDATED") {
      return NextResponse.redirect(
        new URL("/dashboard/recruiter/subscription?status=failed", request.url)
      );
    }

    // Validate with SSLCommerz server
    const validation = await validateSSLCommerzPayment(valId);

    if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return NextResponse.redirect(
        new URL("/dashboard/recruiter/subscription?status=failed", request.url)
      );
    }

    // Update subscription
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.subscription.update({
      where: { sslTransactionId: tranId },
      data: {
        status: "ACTIVE",
        startsAt: now,
        expiresAt,
        validationData: validation,
      },
      include: {
        user: true,
      }
    });

    // Update User subscription tier and usage count
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionTier: subscription.planName,
        subscriptionExpiresAt: expiresAt,
        aiUsageCount: 0, // Reset usage count on new subscription
      },
    });

    // If recruiter, update recruiter profile to premium
    if (subscription.user.role === "RECRUITER") {
      await prisma.recruiterProfile.updateMany({
        where: { userId: subscription.userId },
        data: {
          isPremium: true,
          subscriptionExpiresAt: expiresAt,
        },
      });
    }

    // Send email asynchronously
    if (subscription.user.email) {
      sendEmail({
        to: subscription.user.email,
        subject: "Your Subscription is Active!",
        react: SubscriptionSuccessEmail({
          recruiterName: subscription.user.name || "User",
          planName: subscription.planName || "Premium",
          amount: subscription.amount,
        }),
      }).catch(console.error);
    }

    const redirectPath = subscription.user.role === "RECRUITER"
      ? "/dashboard/recruiter/subscription?status=success"
      : "/dashboard/jobseeker/subscription?status=success";

    return NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
  } catch (error) {
    console.error("Payment success callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }
}
