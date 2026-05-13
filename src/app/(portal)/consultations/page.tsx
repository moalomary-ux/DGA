import { db } from '@/lib/db';
import { BookOpen, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Consultation {
  id: number; topic: string; type: string | null; status: string;
  scheduled_at: Date | null; client_name: string | null;
}

const STATUS: Record<string, { label: string; className: string; icon: typeof Calendar }> = {
  requested: { label: 'مطلوبة',   className: 'badge-warning', icon: Clock },
  scheduled: { label: 'مجدولة',   className: 'badge-info',    icon: Calendar },
  completed: { label: 'منتهية',   className: 'badge-success', icon: CheckCircle2 },
};

export default async function ConsultationsPage() {
  const items = await db<Consultation[]>`
    SELECT c.*, cl.name_ar AS client_name
    FROM consultations c
    LEFT JOIN clients cl ON cl.id = c.client_id
    ORDER BY c.requested_at DESC
  `;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>الاستشارات</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>طلبات الاستشارة والاجتماعات الاستراتيجية</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> استشارة جديدة</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((c) => {
          const s = STATUS[c.status] || { label: c.status, className: 'badge-neutral', icon: BookOpen };
          const Icon = s.icon;
          return (
            <div key={c.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--primary-bg-2)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{c.topic}</h3>
                  <span className={`badge ${s.className}`}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {c.client_name && <span>العميل: {c.client_name}</span>}
                  {c.type && <span>النوع: {c.type}</span>}
                  {c.scheduled_at && <span>الموعد: {new Date(c.scheduled_at).toLocaleString('ar-SA')}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
