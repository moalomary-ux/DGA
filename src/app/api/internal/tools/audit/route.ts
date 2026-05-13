import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  if (!body.user_id || !body.tool_name) {
    return NextResponse.json({ ok: false, error: "missing user_id or tool_name" }, { status: 400 });
  }
  try {
    const rows = await db<any[]>`
      INSERT INTO ai_tool_calls
        (conversation_id, user_id, tenant_id, user_role, tool_name,
         tool_args, tool_result, result_summary, success, error, duration_ms)
      VALUES (
        ${body.conversation_id || null},
        ${body.user_id}::uuid,
        ${body.tenant_id || null},
        ${body.role || null},
        ${body.tool_name},
        ${JSON.stringify(body.tool_args || {})}::jsonb,
        ${JSON.stringify(body.tool_result || {})}::jsonb,
        ${body.result_summary || null},
        ${body.success !== false},
        ${body.error || null},
        ${body.duration_ms || 0}
      ) RETURNING id`;
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (e: any) {
    console.error("audit error:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
