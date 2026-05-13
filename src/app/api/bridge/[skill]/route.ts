import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { executeSkill } from '@/lib/bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ skill: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { skill } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const result = await executeSkill({
      skill_id: skill,
      inputs: body.inputs || body,
      model: body.model,
      user_id: session.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}
