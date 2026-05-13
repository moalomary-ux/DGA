import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const conversationId = formData.get("conversation_id");
  
  if (!file) return NextResponse.json({ ok:false, error:"no file" }, { status:400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ ok:false, error:"too large (max 25MB)" }, { status:413 });
  
  // Get user slug
  const userRows = await db<{ vault_slug: string }[]>`SELECT vault_slug FROM users WHERE id = ${s.userId as string}::uuid`;
  if (userRows.length === 0 || !userRows[0].vault_slug) {
    return NextResponse.json({ ok:false, error:"user slug not set" }, { status:500 });
  }
  const slug = userRows[0].vault_slug;
  
  const bridgeForm = new FormData();
  bridgeForm.append("file", file);
  bridgeForm.append("user_slug", slug);
  if (conversationId) bridgeForm.append("conversation_id", conversationId.toString());
  
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` },
      body: bridgeForm,
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ ok:false, error:`bridge HTTP ${r.status}: ${err.slice(0, 200)}` }, { status: 502 });
    }
    const bridgeResp = await r.json();
    
    const rows = await db<{ id: string }[]>`
      INSERT INTO user_files (user_id, filename, mime_type, size_bytes, storage_path, extracted_text, conversation_id)
      VALUES (${s.userId as string}::uuid, ${file.name}, ${bridgeResp.mime_type}, ${bridgeResp.size_bytes}, ${bridgeResp.storage_path}, ${bridgeResp.extracted_text || null}, ${conversationId ? Number(conversationId) : null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id, filename: file.name, size_bytes: bridgeResp.size_bytes, mime_type: bridgeResp.mime_type, has_extracted: bridgeResp.has_extracted });
  } catch (e) {
    return NextResponse.json({ ok:false, error: String(e) }, { status: 503 });
  }
}
