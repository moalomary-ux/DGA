import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s: any = await getSession();
    return NextResponse.json({
      ok: true,
      isLoggedIn: s.isLoggedIn,
      userId: s.userId,
      userId_type: typeof s.userId,
      userId_undefined: s.userId === undefined,
      email: s.email,
      tenantId: s.tenantId,
      memberships: s.memberships,
      all_keys: Object.keys(s),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message, stack: e?.stack?.split('\n').slice(0, 8) }, { status: 500 });
  }
}
