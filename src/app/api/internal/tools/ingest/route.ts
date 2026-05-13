import { NextRequest, NextResponse } from "next/server";
import { ingestText } from "@/lib/rag";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.content)
    return NextResponse.json({ ok: false, error: "missing title/content" }, { status: 400 });

  try {
    const r = await ingestText({
      title: body.title, content: body.content,
      tenant_id: body.tenant_id || null, owner_id: body.owner_id || null,
      source_type: body.source_type || 'manual',
      source_path: body.source_path || null,
      mime_type: body.mime_type || 'text/plain',
      metadata: body.metadata || {},
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    console.error('ingest error:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message?.slice(0, 300) || "ingest error" }, { status: 500 });
  }
}
