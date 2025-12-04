import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsShape = { code?: string };
type HandlerCtx = { params?: Promise<ParamsShape> | ParamsShape };

// helper to safely resolve params (handles both promise & plain)
async function resolveCode(params?: Promise<ParamsShape> | ParamsShape) {
  const resolved = params && typeof (params as any).then === "function"
    ? await (params as Promise<ParamsShape>)
    : (params as ParamsShape | undefined);
  return resolved?.code;
}

// GET /api/links/:code
export async function GET(_req: Request, ctx: HandlerCtx) {
  const code = await resolveCode(ctx?.params);
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const record = await prisma.url.findUnique({ where: { shortCode: code } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(record);
}

// DELETE /api/links/:code
export async function DELETE(_req: Request, ctx: HandlerCtx) {
  const code = await resolveCode(ctx?.params);
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const record = await prisma.url.findUnique({ where: { shortCode: code } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.url.delete({ where: { shortCode: code } });
  return NextResponse.json({ ok: true });
}
