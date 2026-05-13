import { db } from '@/lib/db';
import {
  GraduationCap, Users, Inbox, Target, Calendar as CalIcon,
  ChevronLeft, Sparkles, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { KpiCard } from '@/components/qtech/KpiCard';
import { CapBar } from '@/components/qtech/CapBar';
import { Pill } from '@/components/qtech/Pill';
import { Pipeline, type PipelineStage } from '@/components/qtech/Pipeline';

interface Props {
  session: { nameAr?: string; email?: string };
  tenant: { id: string; description: string };
}

const STATUS_META: Record<string, { ar: string; tone: 'success' | 'warning' | 'info' | 'muted' | 'accent' }> = {
  draft:     { ar: 'مسودّة',          tone: 'muted'   },
  open:      { ar: 'تسجيل مفتوح',    tone: 'info'    },
  running:   { ar: 'قيد التنفيذ',    tone: 'info'    },
  completed: { ar: 'مكتمل',            tone: 'success' },
  cancelled: { ar: 'ملغي',              tone: 'muted'   },
};

export async function QtechDashboard({ session, tenant }: Props) {
  const [progs, trainees, partners, running, urgentTasks] = await Promise.all([
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM ecosystem_programs`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM trainees WHERE status = 'active'`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM partners WHERE status = 'active'`,
    db<{
      id: number; code: string; name_ar: string; status: string;
      capacity: number | null; start_date: Date | null; end_date: Date | null;
      enrolled: string;
    }[]>`
      SELECT p.id, p.code, p.title_ar, p.status, p.capacity, p.start_date, p.end_date,
        COALESCE((SELECT COUNT(*) FROM enrollments e WHERE e.program_id = p.id), 0) as enrolled
      FROM ecosystem_programs p
      WHERE p.status IN ('running','open','draft')
      ORDER BY
        CASE p.status WHEN 'running' THEN 1 WHEN 'open' THEN 2 ELSE 3 END,
        p.start_date NULLS LAST
      LIMIT 6
    `,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM nominations WHERE status = 'waiting'`.catch(() => [{ count: '0' }]),
  ]);

  const activeCount = running.filter((p) => p.status === 'running' || p.status === 'open').length;
  const totalEnrolled = running.reduce((acc, p) => acc + Number(p.enrolled), 0);
  const completionAvg = running.length > 0
    ? Math.round(running.filter((p) => p.status === 'running').reduce((a, p) => {
        const total = (p.end_date && p.start_date)
          ? (new Date(p.end_date).getTime() - new Date(p.start_date).getTime())
          : 1;
        const elapsed = p.start_date ? Math.max(0, Date.now() - new Date(p.start_date).getTime()) : 0;
        return a + Math.min(100, Math.round((elapsed / total) * 100));
      }, 0) / Math.max(1, running.filter((p) => p.status === 'running').length))
    : 0;

  // الـ pipeline العام
  const pipelineStages: PipelineStage[] = [
    { label: 'فكرة',          state: 'done' },
    { label: 'تطوير محتوى',  state: 'done' },
    { label: 'مراجعة',         state: 'active' },
    { label: 'تسجيل مفتوح',  state: 'pending' },
    { label: 'قيد التنفيذ',  state: 'pending' },
    { label: 'مكتمل',           state: 'pending' },
  ];

  const today = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="fade-in">
      {/* ─── KPIs ─── */}
      <div className="qt-kpis">
        <KpiCard
          label="البرامج النشطة"
          value={activeCount}
          delta="+12% vs Q4 2025"
          deltaTone="up"
          tone="primary"
          icon={<BookOpen size={16} />}
          href="/programs"
        />
        <KpiCard
          label="إجمالي المتدربين"
          value={Number(trainees[0].count)}
          delta="+8 خلال الشهر"
          deltaTone="up"
          tone="accent"
          icon={<Users size={16} />}
          href="/trainees"
        />
        <KpiCard
          label="ترشيحات معلّقة"
          value={Number(urgentTasks[0].count)}
          delta="تحتاج مراجعة AI"
          deltaTone="flat"
          tone="warning"
          icon={<Inbox size={16} />}
          href="/nominations"
        />
        <KpiCard
          label="نسبة الإنجاز العامة"
          value={completionAvg}
          delta="في المسار"
          deltaTone="up"
          tone="success"
          icon={<Target size={16} />}
          suffix="%" 
        />
      </div>

      {/* ─── Active programs table + tasks ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 18px', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>صحّة البرامج النشطة</h3>
            <Link href="/programs" style={{
              fontSize: 12, color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              عرض الكل <ChevronLeft size={13} />
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                <th style={thStyle}>الرمز</th>
                <th style={thStyle}>البرنامج</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>السعة</th>
              </tr>
            </thead>
            <tbody>
              {running.map((p) => {
                const meta = STATUS_META[p.status] || STATUS_META.draft;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>{p.code}</td>
                    <td style={{ ...tdStyle, color: 'var(--text)', fontWeight: 500 }}>
                      <Link href={`/programs/${p.id}`} style={{ color: 'inherit' }}>{p.title_ar}</Link>
                    </td>
                    <td style={tdStyle}><Pill tone={meta.tone}>{meta.ar}</Pill></td>
                    <td style={tdStyle}><CapBar enrolled={Number(p.enrolled)} capacity={p.capacity || 0} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* اليوم */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>اليوم</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>{today}</div>
            <Link href="/calendar" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: 'var(--primary)', fontWeight: 500,
            }}>
              <CalIcon size={14} /> فتح التقويم
            </Link>
          </div>

          {/* مساعدة الذكاء */}
          <div style={{
            background: 'var(--grad-1)', borderRadius: 14, padding: 20, color: '#fff',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={18} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>مساعد قدراتك (AI)</span>
            </div>
            <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.7, marginBottom: 14 }}>
              اطلب اقتراحات لمعايير القبول، إنشاء برنامج، أو تحليل بيانات المتدربين.
            </p>
            <Link href="/agents" style={{
              display: 'inline-flex', padding: '8px 14px',
              background: 'rgba(255,255,255,0.18)', borderRadius: 8,
              fontSize: 12, fontWeight: 600, color: '#fff',
            }}>تشغيل المساعد ←</Link>
          </div>
        </div>
      </div>

      {/* ─── Pipeline ─── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>دورة حياة البرامج</h3>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>٦ مراحل</span>
        </div>
        <Pipeline stages={pipelineStages} />
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'start',
  padding: '11px 16px',
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--line)',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '13px 16px',
  color: 'var(--text-2)',
};
