import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  // تحديث تلقائي للمنتهية
  await db`
    UPDATE file_shares SET status = 'expired'
    WHERE shared_by = ${s.userId as string}::uuid 
      AND status = 'active' 
      AND (expires_at < NOW() OR (max_downloads IS NOT NULL AND download_count >= max_downloads))
  `;
  
  const rows = await db`
    SELECT s.id, s.token, s.expires_at, s.max_downloads, s.download_count, 
           s.recipient_hint, s.message, s.status, s.created_at, s.last_downloaded_at,
           f.filename, f.mime_type, f.size_bytes
    FROM file_shares s
    JOIN user_files f ON f.id = s.file_id
    WHERE s.shared_by = ${s.userId as string}::uuid
    ORDER BY s.created_at DESC LIMIT 100
  `;
  
  return NextResponse.json({ ok:true, shares: rows });
}
