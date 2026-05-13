import { db } from '@/lib/db';
import { FileText, Plus, AlertTriangle, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Study {
  id: number; code: string; title_ar: string; category: string | null;
  status: string; priority: string;
  due_date: Date | null; abstract: string | null;
  client_name: string | null;
}

const STATUS: Record<string, { label: string; className: string }> = {
  draft:       { label: 'مسودّة',       className: 'badge-neutral' },
  in_progress: { label: 'قيد العمل',  className: 'badge-info'    },
  review:      { label: 'مراجعة',     className: 'badge-warning' },
  delivered:   { label: 'مُسلَّمة',    className: 'badge-success' },
  cancelled:   { label: 'ملغاة',       className: 'badge-danger'  },
};

const PRIORITY: Record<string, { label: string; color: string }> = {
  low:      { label: 'منخفضة',  color: 'var(--text-3)' },
  medium:   { label: 'متوسطة',  color: 'var(--info)' },
  high:     { label: 'مرتفعة',  color: 'var(--warning)' },
  critical: { label: 'حرجة',     color: 'var(--danger)' },
};

export default async function StudiesPage() {
  const studies = await db<Study[]>`
    SELECT s.*, c.name_ar AS client_name
    FROM studies s
    LEFT JOIN clients c ON c.id = s.client_id
    ORDER BY
      CASE s.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      s.due_date ASC NULLS LAST
  `;

  const stats = {
    total:       studies.length,
    inProgress:  studies.filter(s => s.status === 'in_progress').length,
    review:      studies.filter(s => s.status === 'review').length,
    delivered:   studies.filter(s => s.status === 'delivered').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>الدراسات</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>الدراسات الاستشارية للجهات الحكومية</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> دراسة جديدة</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'إجمالي',         value: stats.total,      color: 'var(--dga-purple)',    bg: 'rgba(124,50,201,0.10)', icon: FileText },
          { label: 'قيد العمل',     value: stats.inProgress, color: 'var(--dga-turquoise)', bg: 'rgba(0,171,175,0.10)',  icon: FileText },
          { label: 'بانتظار المراجعة', value: stats.review,  color: 'var(--warning)',       bg: 'var(--warning-bg)',     icon: AlertTriangle },
          { label: 'مُسلَّمة',         value: stats.delivered, color: 'var(--dga-green)',     bg: 'rgba(28,193,130,0.10)', icon: Calendar },
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {studies.map((s) => {
          const status = STATUS[s.status] || { label: s.status, className: 'badge-neutral' };
          const priority = PRIORITY[s.priority] || { label: s.priority, color: 'var(--text-3)' };
          const overdue = s.due_date && new Date(s.due_date) < new Date() && s.status !== 'delivered';

          return (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 }}>
                      {s.code}
                    </code>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                    <span style={{ fontSize: 12, color: priority.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ● {priority.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 6, fontWeight: 600 }}>{s.title_ar}</h3>
                  {s.abstract && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>
                      {s.abstract}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                    {s.client_name && <span>العميل: <strong style={{ color: 'var(--text-2)' }}>{s.client_name}</strong></span>}
                    {s.category && <span>الفئة: <strong style={{ color: 'var(--text-2)' }}>{s.category}</strong></span>}
                    {s.due_date && (
                      <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-3)' }}>
                        التسليم: <strong>{new Date(s.due_date).toLocaleDateString('ar-SA')}</strong>
                        {overdue && ' ⚠'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
