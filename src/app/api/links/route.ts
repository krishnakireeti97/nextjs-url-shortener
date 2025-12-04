import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  url?: string;
  code?: string;
};

// validate URL
function isValidUrl(u: string) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// custom code format: 3–8 alphanumeric
const CODE_RE = /^[A-Za-z0-9]{3,8}$/;

// generate random 6-char code
function genCode(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET() {
  try {
    const all = await prisma.url.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(all);
  } catch (err) {
    console.error("[api/links GET] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json().catch(() => ({} as Body));
    const url = (body.url || "").trim();
    let code = body.code?.trim();

    // validate URL
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // if user provided custom code
    if (code) {
      if (!CODE_RE.test(code)) {
        return NextResponse.json(
          { error: "Custom code must be 3–8 alphanumeric characters" },
          { status: 400 }
        );
      }

      // check uniqueness
      const exists = await prisma.url.findUnique({ where: { shortCode: code } });
      if (exists) {
        return NextResponse.json({ error: "Code already exists" }, { status: 409 });
      }
    } else {
      // generate unique random code
      for (let i = 0; i < 3; i++) {
        const c = genCode();
        const exists = await prisma.url.findUnique({ where: { shortCode: c } });
        if (!exists) {
          code = c;
          break;
        }
      }
      if (!code) {
        return NextResponse.json(
          { error: "Failed generating unique code" },
          { status: 500 }
        );
      }
    }

    // create DB record
    const record = await prisma.url.create({
      data: {
        shortCode: code,
        originalUrl: url,
        clicks: 0,
        lastClicked: null,
      },
    });

    return NextResponse.json(record);
  } catch (err) {
    console.error("[api/links POST] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
