/**
 * SSLCommerz Payment Initiation API
 *
 * POST /api/payments/subscribe — Start a subscription payment
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawPlan = body.plan || "SILVER";
    const planName = rawPlan.toUpperCase();

    let amount = 0;
    if (planName === "SILVER") {
      amount = 199;
    } else if (planName === "GOLD") {
      amount = 249;
    } else if (planName === "PLATINUM") {
      amount = 299;
    } else {
      return NextResponse.json({ error: "Invalid subscription plan name" }, { status: 400 });
    }

    const transactionId = `E360-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Create pending subscription record
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        sslTransactionId: transactionId,
        amount,
        planName,
        status: "PENDING",
      },
    });

    // Initialize SSLCommerz payment
    const result = await initSSLCommerzPayment({
      userId: session.user.id,
      userName: session.user.name || "User",
      userEmail: session.user.email || "",
      amount,
      planName,
      transactionId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Save session key
    await prisma.subscription.update({
      where: { sslTransactionId: transactionId },
      data: { sslSessionKey: result.sessionKey },
    });

    return NextResponse.json({
      success: true,
      gatewayUrl: result.gatewayUrl,
    });
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
