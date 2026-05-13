import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";
const MAX_DAYS = 5;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const days = Math.min(MAX_DAYS, Math.max(1, Number(body.days || 2)));
  const maxDownloads = body.max_downloads ? Math.max(1, Math.min(1000, Number(body.max_downloads))) : null;
  const recipientHint = (body.recipient_hint || "").toString().slice(0, 200) || null;
  const message = (body.message || "").toString().slice(0, 500) || null;
  
  // تحقّق ملكية الملف
  const files = await db<{ id: string; filename: string }[]>`
    SELECT id, filename FROM user_files 
    WHERE id = ${id}::uuid AND user_id = ${s.userId as string}::uuid AND status != 'deleted'
  `;
  if (files.length === 0) return NextResponse.json({ ok:false, error:"file not found" }, { status:404 });
  
  // توليد token
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  await db`
    INSERT INTO file_shares (file_id, shared_by, token, expires_at, max_downloads, recipient_hint, message)
    VALUES (${id}::uuid, ${s.userId as string}::uuid, ${token}, ${expiresAt.toISOString()}, ${maxDownloads}, ${recipientHint}, ${message})
  `;
  
  return NextResponse.json({ 
    ok: true, 
    token,
    url: `https://qtech.help/share/${token}`,
    expires_at: expiresAt.toISOString(),
    days, max_downloads: maxDownloads,
    filename: files[0].filename,
  });
}
