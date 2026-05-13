import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/rag";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN)
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.user_id) return NextResponse.json({ ok: false, error: "missing user_id" }, { status: 400 });

  const args = body.args || {};
  const query = String(args.query || '').trim();
  if (!query) return NextResponse.json({ ok: false, error: "missing query" }, { status: 400 });

  const limit = Math.min(Number(args.limit) || 5, 20);
  const tenantId = body.role === 'super_admin' ? null : (body.tenant_id || null);

  try {
    const results = await searchDocuments(query, { tenant_id: tenantId, limit, min_similarity: 0.2 });
    return NextResponse.json({
      ok: true, count: results.length, query,
      results: results.map((r: any) => ({
        document_id: r.document_id, title: r.title,
        chunk: String(r.content).slice(0, 400),
        similarity: Number(r.similarity).toFixed(3),
        source_type: r.source_type, source_path: r.source_path,
      })),
    });
  } catch (e: any) {
    console.error('search error:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message?.slice(0, 200) || "search error" }, { status: 500 });
  }
}
