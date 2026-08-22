import { NextRequest, NextResponse } from "next/server";

const VPS = process.env.VPS_API_BASE ?? "http://154.16.66.54:8000";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${VPS}/api/${path.join("/")}${req.nextUrl.search}`;
  const res = await fetch(url, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: req.method !== "GET" ? await req.text() : undefined,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
