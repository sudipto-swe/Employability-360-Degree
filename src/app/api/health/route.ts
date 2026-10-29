/**
 * Health Check API
 * 
 * Used by UptimeRobot and deployment checks.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "employability-360",
  });
}
