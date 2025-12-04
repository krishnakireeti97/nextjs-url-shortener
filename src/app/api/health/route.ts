import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  try {
    // quick DB check
    await prisma.$queryRaw`SELECT 1`;
    const uptime = process.uptime();
    return NextResponse.json({
      status: "ok",
      timestamp: now.toISOString(),
      uptimeSeconds: Math.floor(uptime),
    });
  } catch (err) {
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
