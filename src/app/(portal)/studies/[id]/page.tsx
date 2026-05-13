import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileText, Calendar, AlertTriangle, Building2, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Study {
  id: number; code: string; title_ar: string; title_en: string | null;
  category: string | null; status: string; priority: string;
  start_date: Date | null; due_date: Date | null;
  delivered_at: Date | null; abstract: string | null;
  client_name: string | null;
  service_name: string | null;
  service_group: string | null;
}

const STATUS: Record<string, { label: string; className: string }> = {
  draft:       { label: 'مسودّة',       className: 'badge-neutral' },
  in_progress: { label: 'قيد العمل',  className: 'badge-info' },
  review:      { label: 'مراجعة',     className: 'badge-warning' },
  delivered:   { label: 'مُسلَّمة',    className: 'badge-success' },
  cancelled:   { label: 'ملغاة',       className: 'badge-danger' },
};

const PRIORITY: Record<string, { label: string; color: string }> = {
  low:      { label: 'منخفضة',  color: 'var(--text-3)' },
  medium:   { label: 'متوسطة',  color: 'var(--info)' },
  high:     { label: 'مرتفعة',  color: 'var(--warning)' },
  critical: { label: 'حرجة',     color: 'var(--danger)' },
};

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studyId = parseInt(id);
  if (isNaN(studyId)) notFound();

  const rows = await db<Study[]>`
    SELECT s.*, c.name_ar AS client_name,
      sc.name_ar AS service_name, sc.category_group AS service_group
    FROM studies s
    LEFT JOIN clients c ON c.id = s.client_id
    LEFT JOIN service_categories sc ON sc.id = s.service_category_id
    WHERE s.id = ${studyId}
  `;
  if (rows.length === 0) notFound();
  const s = rows[0];

  const status = STATUS[s.status] || { label: s.status, className: 'badge-neutral' };
  const priority = PRIORITY[s.priority] || { label: s.priority, color: 'var(--text-3)' };
  const overdue = s.due_date && new Date(s.due_date) < new Date() && s.status !== 'delivered';

  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) : '—';

  return (
    <div>
      <Link href="/studies" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-3)', marginBottom: 24,
      }}>
        <ArrowRight size={14} /> رجوع للدراسات
      </Link>

      <div style={{
        padding: 32, marginBottom: 24,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)',
        borderRadius: 16, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 6 }}>{s.code}</code>
          <span className={`badge ${status.className}`}>{status.label}</span>
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: priority.color, color: '#fff' }}>
            ● {priority.label}
          </span>
          {overdue && (
            <span className="badge badge-danger" style={{ background: 'var(--danger)', color: '#fff' }}>
              <AlertTriangle size={12} /> متأخّرة
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12, lineHeight: 1.4, color: '#fff' }}>{s.title_ar}</h1>
        {s.abstract && (
          <p style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.85)', maxWidth: 800 }}>
            {s.abstract}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        <MetaCard icon={Building2} label="العميل" value={s.client_name || '—'} />
        <MetaCard icon={Tag} label="نوع الخدمة" value={s.service_name || s.category || '—'} />
        <MetaCard icon={Calendar} label="تاريخ البدء" value={formatDate(s.start_date)} />
        <MetaCard icon={Calendar} label="تاريخ التسليم" value={formatDate(s.due_date)} highlight={overdue ? 'var(--danger)' : undefined} />
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value, highlight }: {
  icon: typeof Calendar; label: string; value: string; highlight?: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={16} style={{ color: highlight || 'var(--text-3)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: highlight || 'inherit' }}>{value}</div>
    </div>
  );
}
