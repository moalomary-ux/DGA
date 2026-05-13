import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok:false, error:"unauthorized" }, { status:401 });
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/agents/list`, {
      headers: { "Authorization": `Bearer ${BRIDGE_TOKEN}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return NextResponse.json({ ok:false, error:`bridge HTTP ${r.status}` }, { status:502 });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ ok:false, error:`bridge unreachable: ${e}` }, { status:503 });
  }
}
