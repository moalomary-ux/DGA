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
  const rows = await db`
    SELECT id, filename, mime_type, size_bytes, storage_path, extracted_text, status, tags, uploaded_at, last_accessed_at
    FROM user_files WHERE id = ${id}::uuid AND user_id = ${s.userId as string}::uuid AND status != 'deleted'
  `;
  if (rows.length === 0) return NextResponse.json({ ok:false, error:"not found" }, { status:404 });
  await db`UPDATE user_files SET last_accessed_at = NOW() WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok:true, file: rows[0] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { id } = await ctx.params;
  const rows = await db<{ storage_path: string }[]>`SELECT storage_path FROM user_files WHERE id = ${id}::uuid AND user_id = ${s.userId as string}::uuid`;
  if (rows.length === 0) return NextResponse.json({ ok:false, error:"not found" }, { status:404 });
  
  try {
    await fetch(`${BRIDGE_URL}/v1/files/remove?path=${encodeURIComponent(rows[0].storage_path)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
  } catch {}
  
  await db`UPDATE user_files SET status = 'deleted' WHERE id = ${id}::uuid AND user_id = ${s.userId as string}::uuid`;
  return NextResponse.json({ ok:true });
}
