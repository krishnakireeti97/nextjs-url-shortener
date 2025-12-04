import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParamsShape = { code?: string } | undefined;
type Ctx = { params?: ParamsShape | Promise<ParamsShape> };

// helper to safely resolve params (handles both Promise and plain object)
async function resolveCode(params?: ParamsShape | Promise<ParamsShape>) {
  if (!params) return undefined;
  if (typeof (params as any).then === "function") {
    const resolved = await (params as Promise<ParamsShape>);
    return resolved?.code;
  }
  return (params as ParamsShape)?.code;
}

export async function GET(req: Request, ctx: Ctx) {
  // resolve code from ctx.params (await if it's a Promise)
  const codeFromParams = await resolveCode(ctx?.params);

  // fallback to last path segment if params missing
  const code =
    codeFromParams ??
    (() => {
      try {
        const p = new URL(req.url).pathname.split("/").filter(Boolean);
        return p.length ? p[p.length - 1] : undefined;
      } catch {
        return undefined;
      }
    })();

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const urlRecord = await prisma.url.findUnique({ where: { shortCode: code } });
    if (!urlRecord) {
      // Return 404 JSON — deleted codes must not redirect.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // increment clicks and update lastClicked (non-blocking to user experience is ok,
    // but we'll await to ensure DB state is consistent for tests)
    await prisma.url.update({
      where: { id: urlRecord.id },
      data: { clicks: { increment: 1 }, lastClicked: new Date() },
    });

    // 302 redirect to the original URL
    return NextResponse.redirect(urlRecord.originalUrl, 302);
  } catch (err) {
    console.error("[redirect error]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}