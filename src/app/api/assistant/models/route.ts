import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || 'http://10.10.10.2:7080';
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || '';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const res = await fetch(`${BRIDGE_URL}/v1/chat/models`, {
      headers: { 'Authorization': `Bearer ${BRIDGE_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: `bridge ${res.status}` });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'bridge unreachable' });
  }
}
