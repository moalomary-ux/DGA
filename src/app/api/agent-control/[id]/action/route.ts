import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isSuperAdmin) return NextResponse.json({ ok:false, error:"super_admin only" }, { status:403 });
  
  const { id } = await ctx.params;
  const { action } = await req.json();
  if (!["restart","start","stop"].includes(action)) return NextResponse.json({ ok:false, error:"invalid action" }, { status:400 });
  
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/agents/${id}/${action}`, {
      method:"POST",
      headers:{ "Authorization":`Bearer ${BRIDGE_TOKEN}`, "X-Actor":(session.email as string) || "unknown" },
      signal: AbortSignal.timeout(15000),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e) {
    return NextResponse.json({ ok:false, error:`bridge: ${e}` }, { status:503 });
  }
}
