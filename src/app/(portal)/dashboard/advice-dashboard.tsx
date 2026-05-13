import { db } from '@/lib/db';
import { FileText, Building2, BookOpen, AlertTriangle, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Props {
  session: { nameAr?: string; email?: string };
  tenant: { id: string; description: string };
}

export async function AdviceDashboard({ session, tenant }: Props) {
  const [studies, clients, consult, urgent] = await Promise.all([
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM studies WHERE status IN ('in_progress','review')`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM clients`,
    db<{ count: string }[]>`SELECT COUNT(*) as count FROM consultations WHERE status IN ('requested','scheduled')`,
    db<{ id: number; code: string; title_ar: string; due_date: Date | null; priority: string; client_name: string | null }[]>`
      SELECT s.id, s.code, s.title_ar, s.due_date, s.priority, c.name_ar AS client_name
      FROM studies s LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.status IN ('in_progress','review')
      ORDER BY CASE s.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, s.due_date ASC NULLS LAST
      LIMIT 5
    `,
  ]);

  const today = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div>
      <div className="hero" style={{ marginBottom: 32 }}>
        <div className="hero-eyebrow">{today}</div>
        <h1 className="hero-title">الاستشارات والدراسات الرقمية</h1>
        <p className="hero-subtitle">دعم اتخاذ القرار الرقمي للجهات الحكومية السعودية</p>
        <div className="hero-meta">
          <div className="hero-meta-item">دراسات نشطة<strong>{studies[0].count}</strong></div>
          <div className="hero-meta-item">عملاء<strong>{clients[0].count}</strong></div>
          <div className="hero-meta-item">استشارات<strong>{consult[0].count}</strong></div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'الدراسات الجارية', value: studies[0].count, icon: FileText,        color: 'var(--dga-purple)',    bg: 'rgba(124,50,201,0.10)' },
          { label: 'العملاء',           value: clients[0].count, icon: Building2,       color: 'var(--dga-turquoise)', bg: 'rgba(0,171,175,0.10)' },
          { label: 'الاستشارات',       value: consult[0].count, icon: BookOpen,        color: 'var(--dga-green)',     bg: 'rgba(28,193,130,0.10)' },
          { label: 'تنبيهات',          value: urgent.filter(u => u.due_date && new Date(u.due_date) < new Date()).length, icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card" style={{ ['--stat-color' as string]: s.color, ['--stat-bg' as string]: s.bg } as React.CSSProperties}>
              <div className="stat-card-icon"><Icon size={20} strokeWidth={1.8} /></div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="section-header">
        <div className="section-title"><span className="section-title-bar" /> أولويات الإنتاج</div>
        <Link href="/studies" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          كل الدراسات <ArrowLeft size={14} />
        </Link>
      </div>

      <div className="card-bordered">
        <table className="table">
          <thead>
            <tr>
              <th>الرمز</th>
              <th>العنوان</th>
              <th>العميل</th>
              <th>الأولوية</th>
              <th>التسليم</th>
            </tr>
          </thead>
          <tbody>
            {urgent.map((s) => {
              const overdue = s.due_date && new Date(s.due_date) < new Date();
              const priorityColor = s.priority === 'critical' ? 'var(--danger)' : s.priority === 'high' ? 'var(--warning)' : 'var(--text-3)';
              return (
                <tr key={s.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{s.code}</code></td>
                  <td><div style={{ fontWeight: 500, fontSize: 13 }}>{s.title_ar}</div></td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.client_name || '—'}</td>
                  <td><span style={{ color: priorityColor, fontWeight: 500, fontSize: 12 }}>● {s.priority}</span></td>
                  <td style={{ fontSize: 13, color: overdue ? 'var(--danger)' : 'var(--text-2)' }}>
                    {s.due_date ? new Date(s.due_date).toLocaleDateString('ar-SA') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
