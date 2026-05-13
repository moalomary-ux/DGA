import { db } from '@/lib/db';
import type { TenantId } from '@/lib/db';

export interface CalendarEvent {
  id: string;
  type: 'program' | 'study' | 'consultation' | 'monday_task' | 'personal';
  title: string;
  date: Date;
  endDate?: Date;
  source: string;
  status?: string;
  priority?: string;
  url?: string;
  meta?: Record<string, unknown>;
  isAssigned?: boolean;       // هل الحدث مُسند للمستخدم تحديداً؟
  crossTenant?: boolean;      // هل المهمة من بوابة أخرى؟
  /** كود نوع البرنامج لـ qtech فقط (PROG_LOCAL / PROG_INTL / WORKSHOP / WEBINAR / SEMINAR / ...) */
  formatCode?: string;
  /** اسم نوع البرنامج بالعربي */
  formatName?: string;
}

export const TYPE_LABELS: Record<CalendarEvent['type'], string> = {
  program:      'برنامج',
  study:        'دراسة',
  consultation: 'استشارة',
  monday_task:  'مهمة',
  personal:     'شخصي',
};

/**
 * يجلب الأحداث في النطاق الزمني، **مع العزل الصارم بين البوابات**:
 * - qtech  : programs فقط من نفس البوابة
 * - advice : studies + consultations فقط من نفس البوابة
 * - omary  : كل شيء (البوابة الأم)
 *
 * **استثناء cross-tenant**: لو الموظف مُسند لمهمة في بوابة أخرى عبر
 * task_assignments، يشوفها (مع علامة crossTenant).
 */
export async function getEventsInRange(
  startDate: Date,
  endDate: Date,
  tenantId: TenantId,
  userId?: string,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // 1. أحداث البوابة الحالية (محتوى أصلي)
  // ─────────────────────────────────────────────────────────────────────────
  if (tenantId === 'qtech' || tenantId === 'omary') {
    const programs = await db<{
      id: number; code: string; name_ar: string;
      start_date: Date | null; end_date: Date | null; status: string;
      delivery_mode: string | null; scope: string | null; location: string | null;
      format_code: string | null;
      format_name: string | null;
    }[]>`
      SELECT p.id, p.code, p.title_ar, p.start_date, p.end_date, p.status,
             p.delivery_mode, p.scope, p.location,
             pf.code AS format_code,
             pf.name_ar AS format_name
      FROM ecosystem_programs p
      LEFT JOIN program_formats pf ON pf.id = p.format_id
      WHERE (p.start_date BETWEEN ${startDate} AND ${endDate})
         OR (p.end_date BETWEEN ${startDate} AND ${endDate})
         OR (p.start_date <= ${startDate} AND p.end_date >= ${endDate})
    `;
    for (const p of programs) {
      if (!p.start_date) continue;
      events.push({
        id: `program:${p.id}`,
        type: 'program',
        title: p.title_ar,
        date: new Date(p.start_date),
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        source: `قدراتك · ${p.code}`,
        status: p.status,
        url: `/programs/${p.id}`,
        formatCode: p.format_code || undefined,
        formatName: p.format_name || undefined,
        meta: {
          delivery_mode: p.delivery_mode,
          scope: p.scope,
          location: p.location,
          format: p.format_name,
          format_code: p.format_code,
        },
      });
    }
  }

  if (tenantId === 'advice' || tenantId === 'omary') {
    const studies = await db<{
      id: number; code: string; title_ar: string;
      due_date: Date | null; status: string; priority: string;
      service_name: string | null;
    }[]>`
      SELECT s.id, s.code, s.title_ar, s.due_date, s.status, s.priority,
             sc.name_ar AS service_name
      FROM studies s
      LEFT JOIN service_categories sc ON sc.id = s.service_category_id
      WHERE s.due_date BETWEEN ${startDate} AND ${endDate}
    `;
    for (const s of studies) {
      if (!s.due_date) continue;
      events.push({
        id: `study:${s.id}`,
        type: 'study',
        title: s.title_ar,
        date: new Date(s.due_date),
        source: `دراسة · ${s.code}`,
        status: s.status,
        priority: s.priority,
        url: `/studies/${s.id}`,
        meta: { service_type: s.service_name },
      });
    }

    const consults = await db<{
      id: number; topic: string; scheduled_at: Date | null; status: string;
    }[]>`
      SELECT id, topic, scheduled_at, status FROM consultations
      WHERE scheduled_at BETWEEN ${startDate} AND ${endDate}
    `;
    for (const c of consults) {
      if (!c.scheduled_at) continue;
      events.push({
        id: `consultation:${c.id}`,
        type: 'consultation',
        title: c.topic,
        date: new Date(c.scheduled_at),
        source: 'استشارة',
        status: c.status,
        url: `/consultations`,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. مهام مُسندة من بوابات أخرى (cross-tenant)
  //    موظف من qtech قد يُسند له دراسة من advice، يظهر في تقويمه
  // ─────────────────────────────────────────────────────────────────────────
  if (userId && tenantId !== 'omary') {
    const otherTenant = tenantId === 'qtech' ? 'advice' : 'qtech';

    const crossTasks = await db<{
      task_type: string; task_id: number; role: string | null;
      title: string; date: Date | null; end_date: Date | null;
      status: string | null; priority: string | null;
    }[]>`
      SELECT
        ta.task_type, ta.task_id, ta.role,
        CASE
          WHEN ta.task_type = 'program'      THEN p.title_ar
          WHEN ta.task_type = 'study'        THEN s.title_ar
          WHEN ta.task_type = 'consultation' THEN c.topic
        END AS title,
        CASE
          WHEN ta.task_type = 'program'      THEN p.start_date
          WHEN ta.task_type = 'study'        THEN s.due_date
          WHEN ta.task_type = 'consultation' THEN c.scheduled_at
        END AS date,
        CASE WHEN ta.task_type = 'program' THEN p.end_date ELSE NULL END AS end_date,
        CASE
          WHEN ta.task_type = 'program'      THEN p.status
          WHEN ta.task_type = 'study'        THEN s.status
          WHEN ta.task_type = 'consultation' THEN c.status
        END AS status,
        CASE WHEN ta.task_type = 'study' THEN s.priority ELSE NULL END AS priority
      FROM task_assignments ta
      LEFT JOIN ecosystem_programs p      ON ta.task_type = 'program'      AND p.id = ta.task_id
      LEFT JOIN studies s       ON ta.task_type = 'study'        AND s.id = ta.task_id
      LEFT JOIN consultations c ON ta.task_type = 'consultation' AND c.id = ta.task_id
      WHERE ta.user_id = ${userId} AND ta.source_tenant = ${otherTenant}
    `;

    for (const t of crossTasks) {
      if (!t.date) continue;
      const d = new Date(t.date);
      if (d < startDate || d > endDate) continue;

      events.push({
        id: `${t.task_type}:cross:${t.task_id}`,
        type: t.task_type as CalendarEvent['type'],
        title: t.title || '',
        date: d,
        endDate: t.end_date ? new Date(t.end_date) : undefined,
        source: `${otherTenant === 'advice' ? 'الاستشارات' : 'قدراتك'} · ${t.role || 'مساهم'}`,
        status: t.status || undefined,
        priority: t.priority || undefined,
        url: `/${t.task_type}s/${t.task_id}`,
        isAssigned: true,
        crossTenant: true,
      });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
