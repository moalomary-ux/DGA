import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { id } = await ctx.params;
  const rows = await db<{ storage_path: string; mime_type: string }[]>`
    SELECT storage_path, mime_type FROM user_files
    WHERE id = ${id}::uuid AND user_id = ${s.userId as string}::uuid AND status != 'deleted'
  `;
  if (rows.length === 0 || !rows[0].mime_type?.startsWith("image/")) return NextResponse.json({ ok:false }, { status:404 });
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/files/thumbnail?path=${encodeURIComponent(rows[0].storage_path)}`, { headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` } });
    if (!r.ok) return NextResponse.json({ ok:false }, { status: 502 });
    return new Response(r.body, { headers: { "Content-Type": rows[0].mime_type, "Cache-Control": "max-age=3600" } });
  } catch (e) {
    return NextResponse.json({ ok:false, error: String(e) }, { status: 503 });
  }
}
