/**
 * SSLCommerz Cancel Callback
 * POST /api/payments/sslcommerz/cancel
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tranId = formData.get("tran_id") as string;

    let redirectPath = "/dashboard";

    if (tranId) {
      const subscription = await prisma.subscription.findUnique({
        where: { sslTransactionId: tranId },
        include: { user: true },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELLED" },
        });
        redirectPath = subscription.user.role === "RECRUITER"
          ? "/dashboard/recruiter/subscription?status=cancelled"
          : "/dashboard/jobseeker/subscription?status=cancelled";
      }
    }

    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("Payment cancel callback error:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
