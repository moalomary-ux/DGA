import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  
  const rows = await db<{ 
    id: string; file_id: string; status: string; expires_at: string;
    max_downloads: number | null; download_count: number;
    storage_path: string; filename: string; mime_type: string;
  }[]>`
    SELECT s.id, s.file_id, s.status, s.expires_at, s.max_downloads, s.download_count,
           f.storage_path, f.filename, f.mime_type
    FROM file_shares s JOIN user_files f ON f.id = s.file_id
    WHERE s.token = ${token}
  `;
  
  if (rows.length === 0) return NextResponse.json({ ok:false, error:"رابط غير صحيح" }, { status:404 });
  const share = rows[0];
  
  // فحوصات
  if (share.status !== 'active') return NextResponse.json({ ok:false, error:"الرابط لم يعد متاحاً" }, { status:410 });
  if (new Date(share.expires_at) < new Date()) {
    await db`UPDATE file_shares SET status = 'expired' WHERE id = ${share.id}::uuid`;
    return NextResponse.json({ ok:false, error:"انتهت صلاحية الرابط" }, { status:410 });
  }
  if (share.max_downloads !== null && share.download_count >= share.max_downloads) {
    await db`UPDATE file_shares SET status = 'expired' WHERE id = ${share.id}::uuid`;
    return NextResponse.json({ ok:false, error:"تجاوز عدد التحميلات المسموح" }, { status:410 });
  }
  
  // جلب الملف من Bridge
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/files/read?path=${encodeURIComponent(share.storage_path)}`, {
      headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` },
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) return NextResponse.json({ ok:false, error:"تعذر جلب الملف" }, { status:502 });
    
    // increment counter
    await db`
      UPDATE file_shares 
      SET download_count = download_count + 1, last_downloaded_at = NOW() 
      WHERE id = ${share.id}::uuid
    `;
    
    return new Response(r.body, { 
      headers: { 
        "Content-Type": share.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(share.filename)}`,
      } 
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error: String(e) }, { status:503 });
  }
}
