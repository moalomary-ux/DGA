import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  try {
    const r = await fetch(`${BRIDGE_URL}/v1/chat/models`, { headers: { Authorization: `Bearer ${BRIDGE_TOKEN}` }, signal: AbortSignal.timeout(5000) });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ ok:false, error: String(e) }, { status:503 });
  }
}
