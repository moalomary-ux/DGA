import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  const roles = await db<{role: string}[]>`
    SELECT role FROM memberships 
    WHERE user_id = ${s.userId as string}::uuid AND status = 'active'
  `;
  if (!roles.some(r => r.role === 'super_admin' || r.role === 'admin')) {
    return NextResponse.json({ ok:false, error:"forbidden" }, { status:403 });
  }
  
  const totals = await db`
    SELECT COUNT(*)::int AS total_files, 
           COALESCE(SUM(size_bytes),0)::bigint AS total_bytes, 
           COUNT(DISTINCT user_id)::int AS users_count 
    FROM user_files WHERE status != 'deleted'
  `;
  
  const users = await db`
    SELECT u.id, u.name_ar, u.email, u.vault_slug,
      COUNT(f.id)::int AS file_count,
      COALESCE(SUM(f.size_bytes),0)::bigint AS total_bytes,
      MAX(f.uploaded_at) AS last_upload
    FROM users u
    LEFT JOIN user_files f ON f.user_id = u.id AND f.status != 'deleted'
    GROUP BY u.id, u.name_ar, u.email, u.vault_slug
    HAVING COUNT(f.id) > 0
    ORDER BY total_bytes DESC
  `;
  
  const recent = await db`
    SELECT f.id, f.filename, f.mime_type, f.size_bytes, f.uploaded_at, 
           u.name_ar AS user_name
    FROM user_files f JOIN users u ON u.id = f.user_id
    WHERE f.status != 'deleted'
    ORDER BY f.uploaded_at DESC LIMIT 20
  `;
  
  let diskScan: any = null, lastMaintenance: any = null;
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/files/admin/disk-scan`, { 
      headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` }, 
      signal: AbortSignal.timeout(5000) 
    });
    if (r.ok) diskScan = await r.json();
  } catch {}
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/files/stats`, { 
      headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` }, 
      signal: AbortSignal.timeout(5000) 
    });
    if (r.ok) lastMaintenance = await r.json();
  } catch {}
  
  return NextResponse.json({ ok:true, totals: totals[0], users, recent, diskScan, lastMaintenance });
}
