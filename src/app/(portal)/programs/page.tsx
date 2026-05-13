'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

interface Program {
  id: number;
  title_ar: string;
  code: string | null;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  enrolled_count: number | null;
  status: string | null;
  kind: string | null;
  attendees: number;
}

const KINDS = [
  { id: 'all', ar: 'الكل', color: '#7A82A8' },
  { id: 'international', ar: 'دولي', color: '#7C32C9' },
  { id: 'local', ar: 'محلي', color: '#00ABAF' },
  { id: 'workshop', ar: 'ورشة عمل', color: '#FF8533' },
  { id: 'seminar', ar: 'ندوة معرفية', color: '#3F7DD9' },
  { id: 'closed', ar: 'مغلق', color: '#7A82A8' },
];
const KIND_LOOKUP: Record<string, { ar: string; color: string }> = Object.fromEntries(
  KINDS.filter((k) => k.id !== 'all').map((k) => [k.id, { ar: k.ar, color: k.color }])
);
const STATUS_META: Record<string, { ar: string; cls: string }> = {
  ideation: { ar: 'فكرة', cls: 'accent' },
  development: { ar: 'تجهيز', cls: 'warning' },
  review: { ar: 'مراجعة', cls: 'accent' },
  registration: { ar: 'فتح التسجيل', cls: 'info' },
  execution: { ar: 'قيد التنفيذ', cls: 'success' },
  closed: { ar: 'مغلق', cls: 'muted' },
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/programs/list')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPrograms(d.programs);
        setLoading(false);
      });
  }, []);

  // Counts per kind
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: programs.length };
    for (const k of KINDS) if (k.id !== 'all') c[k.id] = 0;
    for (const p of programs) {
      const k = p.kind || 'local';
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [programs]);

  const filtered = useMemo(() => {
    let list = programs;
    if (kindFilter !== 'all') list = list.filter((p) => (p.kind || 'local') === kindFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title_ar?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.provider?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [programs, kindFilter, search]);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>البرامج التدريبية</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{programs.length} برنامج · مصنّف حسب النوع</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/programs/new" className="btn btn-primary btn-sm" style={{ width: 'auto' }}>
            <Icon n="plus" size={14} /> برنامج جديد
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="topbar-search" style={{ width: '100%', marginBottom: 14 }}>
        <Icon n="search" size={14} />
        <input
          type="text"
          placeholder="بحث بالاسم، الكود، أو الشريك..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kind filter chips */}
      <div className="kind-filter" style={{ marginBottom: 18 }}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            className={`kind-chip ${kindFilter === k.id ? 'on' : ''}`}
            style={{ ['--kc' as string]: k.color }}
            onClick={() => setKindFilter(k.id)}
          >
            <span className="kc-dot" />
            <span>{k.ar}</span>
            <span className="kc-num">({counts[k.id] || 0})</span>
          </button>
        ))}
      </div>

      {/* Programs grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Icon n="book" size={48} />
          <p>لا توجد برامج مطابقة للفلتر</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {filtered.map((p) => {
            const km = KIND_LOOKUP[p.kind || 'local'] || KIND_LOOKUP.local;
            const sm = STATUS_META[p.status || 'ideation'] || STATUS_META.ideation;
            const cap = p.capacity || 0;
            const enr = p.enrolled_count || p.attendees || 0;
            const pct = cap > 0 ? Math.min(100, Math.round((enr / cap) * 100)) : 0;
            return (
              <Link
                key={p.id}
                href={`/programs/${p.id}`}
                className="card prog-card"
                style={{ display: 'block', padding: 0, cursor: 'pointer' }}
              >
                <div className="prog-stripe" style={{ background: km.color }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <span className="kind-tag" style={{ ['--kc' as string]: km.color }}>
                      <Icon n="flag" size={11} /> {km.ar}
                    </span>
                    <span className={`pill ${sm.cls}`}>{sm.ar}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                    {p.code || `#${p.id}`}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{p.title_ar}</h4>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>{p.provider || '—'}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 5, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: 99,
                          background: km.color, width: `${pct}%`, transition: 'width 600ms',
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{pct}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon n="users" size={11} /> {enr}/{cap || '∞'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon n="calendar" size={11} /> {p.start_date?.slice(0, 10) || '—'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
