import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

interface SyncBody {
  entity: 'orgs' | 'programs' | 'attendances' | 'metrics' | 'people';
  rows: Record<string, unknown>[];
  replace_all?: boolean;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token')
    || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: SyncBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }); }

  const { entity, rows, replace_all } = body;
  if (!entity || !Array.isArray(rows)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }
  if (!rows.length) {
    return NextResponse.json({ ok: true, entity, count: 0 });
  }

  let count = 0;

  try {
    await db.begin(async (tx) => {
      if (entity === 'orgs') {
        if (replace_all) await tx`TRUNCATE TABLE ecosystem_organizations`;
        await tx`
          INSERT INTO ecosystem_organizations ${tx(rows as never, 
            'id','name_ar','name_en','short_name','org_type','sector','classification',
            'domain','is_internal','employee_count','website','logo_url','notes','metadata')}
          ON CONFLICT (id) DO UPDATE SET
            name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
            short_name = EXCLUDED.short_name, org_type = EXCLUDED.org_type,
            sector = EXCLUDED.sector, classification = EXCLUDED.classification,
            domain = EXCLUDED.domain, is_internal = EXCLUDED.is_internal,
            employee_count = EXCLUDED.employee_count, website = EXCLUDED.website,
            logo_url = EXCLUDED.logo_url, notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata, last_synced_at = NOW()
        `;
        count = rows.length;
      }
      else if (entity === 'programs') {
        if (replace_all) await tx`TRUNCATE TABLE ecosystem_programs`;
        await tx`
          INSERT INTO ecosystem_programs ${tx(rows as never,
            'id','code','title_ar','title_en','program_type','category','provider',
            'delivery_mode','start_date','end_date','duration_hours','capacity',
            'enrolled_count','rating','status','metadata')}
          ON CONFLICT (id) DO UPDATE SET
            code = EXCLUDED.code, title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en,
            program_type = EXCLUDED.program_type, category = EXCLUDED.category,
            provider = EXCLUDED.provider, delivery_mode = EXCLUDED.delivery_mode,
            start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
            duration_hours = EXCLUDED.duration_hours, capacity = EXCLUDED.capacity,
            enrolled_count = EXCLUDED.enrolled_count, rating = EXCLUDED.rating,
            status = EXCLUDED.status, metadata = EXCLUDED.metadata,
            last_synced_at = NOW()
        `;
        count = rows.length;
      }
      else if (entity === 'attendances') {
        if (replace_all) await tx`TRUNCATE TABLE ecosystem_attendances`;
        await tx`
          INSERT INTO ecosystem_attendances ${tx(rows as never,
            'id','person_id','program_id','role','attendance_date','completed',
            'is_excellent','user_rating','notes','metadata')}
          ON CONFLICT (id) DO UPDATE SET
            person_id = EXCLUDED.person_id, program_id = EXCLUDED.program_id,
            role = EXCLUDED.role, attendance_date = EXCLUDED.attendance_date,
            completed = EXCLUDED.completed, is_excellent = EXCLUDED.is_excellent,
            user_rating = EXCLUDED.user_rating, notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata, last_synced_at = NOW()
        `;
        count = rows.length;
      }
      else if (entity === 'metrics') {
        if (replace_all) await tx`TRUNCATE TABLE ecosystem_org_metrics`;
        await tx`
          INSERT INTO ecosystem_org_metrics ${tx(rows as never,
            'id','organization_id','metric_type','metric_label',
            'numeric_value','text_value','year','source')}
          ON CONFLICT (id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id, metric_type = EXCLUDED.metric_type,
            metric_label = EXCLUDED.metric_label, numeric_value = EXCLUDED.numeric_value,
            text_value = EXCLUDED.text_value, year = EXCLUDED.year,
            source = EXCLUDED.source, last_synced_at = NOW()
        `;
        count = rows.length;
      }
      else if (entity === 'people') {
        await tx`
          INSERT INTO ecosystem_contacts ${tx(rows as never,
            'mac_kg_id','full_name_ar','full_name_en','primary_email','other_emails',
            'phone','organization_ar','organization_short','department_ar',
            'job_title_ar','job_title_en','sector_label','relationship_to_mohammed',
            'seniority_level','importance','notes','national_id','gender','region',
            'role_category','organization_id','is_active','first_seen_at')}
          ON CONFLICT (mac_kg_id) DO UPDATE SET
            full_name_ar = EXCLUDED.full_name_ar, full_name_en = EXCLUDED.full_name_en,
            primary_email = EXCLUDED.primary_email, other_emails = EXCLUDED.other_emails,
            phone = EXCLUDED.phone, organization_ar = EXCLUDED.organization_ar,
            organization_short = EXCLUDED.organization_short, department_ar = EXCLUDED.department_ar,
            job_title_ar = EXCLUDED.job_title_ar, job_title_en = EXCLUDED.job_title_en,
            sector_label = EXCLUDED.sector_label, relationship_to_mohammed = EXCLUDED.relationship_to_mohammed,
            seniority_level = EXCLUDED.seniority_level, importance = EXCLUDED.importance,
            notes = EXCLUDED.notes, national_id = EXCLUDED.national_id,
            gender = EXCLUDED.gender, region = EXCLUDED.region,
            role_category = EXCLUDED.role_category, organization_id = EXCLUDED.organization_id,
            is_active = EXCLUDED.is_active, last_synced_at = NOW()
        `;
        count = rows.length;
      }
      else {
        throw new Error(`unknown entity: ${entity}`);
      }
    });
  } catch (err) {
    console.error('[sync/kg]', entity, err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entity, count });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-bridge-token');
  if (!auth || auth !== process.env.SAMI_BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const counts = await db<{ tbl: string; cnt: number }[]>`
    SELECT 'orgs' tbl, COUNT(*)::int cnt FROM ecosystem_organizations
    UNION ALL SELECT 'programs', COUNT(*)::int FROM ecosystem_programs
    UNION ALL SELECT 'attendances', COUNT(*)::int FROM ecosystem_attendances
    UNION ALL SELECT 'metrics', COUNT(*)::int FROM ecosystem_org_metrics
    UNION ALL SELECT 'contacts', COUNT(*)::int FROM ecosystem_contacts
  `;
  return NextResponse.json({ ok: true, counts });
}
