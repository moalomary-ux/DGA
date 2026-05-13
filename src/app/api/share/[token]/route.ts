import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  
  const rows = await db`
    SELECT s.token, s.expires_at, s.max_downloads, s.download_count, s.status,
           s.recipient_hint, s.message, s.created_at,
           f.filename, f.mime_type, f.size_bytes,
           u.name_ar AS sender_name
    FROM file_shares s 
    JOIN user_files f ON f.id = s.file_id
    JOIN users u ON u.id = s.shared_by
    WHERE s.token = ${token}
  `;
  
  if (rows.length === 0) return NextResponse.json({ ok:false, error:"رابط غير صحيح" }, { status:404 });
  
  const share = rows[0] as any;
  
  // Auto-expire check
  if (share.status === 'active') {
    const expired = new Date(share.expires_at) < new Date();
    const overLimit = share.max_downloads !== null && share.download_count >= share.max_downloads;
    if (expired || overLimit) {
      await db`UPDATE file_shares SET status = 'expired' WHERE token = ${token}`;
      share.status = 'expired';
    }
  }
  
  return NextResponse.json({ ok:true, share });
}
