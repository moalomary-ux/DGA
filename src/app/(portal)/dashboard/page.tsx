'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import QIcon, { fmt, useCounter, STATUS_META } from '@/components/QIcon';

interface Program {
  id: number; code: string | null; title_ar: string; status: string | null;
  capacity: number | null; enrolled_count: number | null; attendees: number;
  start_date: string | null; category: string | null;
}
interface Task {
  id: string; title: string; due: string; priority: string;
  program: string | null; done: boolean;
}
interface LivePgm {
  id: number; code: string | null; title_ar: string; provider: string | null;
  start_date: string | null; end_date: string | null;
  capacity: number | null; enrolled_count: number | null;
}
interface DashData {
  kpis: { active: number; total_attendees: number; pending: number; avg_completion: number };
  programs: Program[];
  live: LivePgm | null;
  tasks: Task[];
}

type Widget = { id: string; colSpan: number; rowSpan: number; order: number };

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'kpis',     colSpan: 12, rowSpan: 3, order: 1 },
  { id: 'programs', colSpan: 8,  rowSpan: 7, order: 2 },
  { id: 'live',     colSpan: 4,  rowSpan: 4, order: 3 },
  { id: 'tasks',    colSpan: 4,  rowSpan: 3, order: 4 },
];

const WIDGET_META: Record<string, { title: string; accent: string }> = {
  kpis:     { title: 'مؤشرات الأداء',       accent: '#06B6D4' },
  programs: { title: 'صحّة البرامج النشطة',  accent: '#10B981' },
  live:     { title: 'البرنامج الجاري',       accent: '#F59E0B' },
  tasks:    { title: 'مهام اليوم',            accent: '#EF4444' },
};

const STORAGE_KEY = 'qudratok-dashboard-widgets-v1';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/data').then((r) => r.json()).then((d) => { if (d.ok) setData(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          const savedIds = new Set(saved.map((w: any) => w.id));
          const newW = DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id));
          if (newW.length > 0) {
            const maxOrder = Math.max(0, ...saved.map((w: any) => w.order || 0));
            saved = [...saved, ...newW.map((w, i) => ({ ...w, order: maxOrder + 1 + i }))];
          }
          const defMap = new Map(DEFAULT_WIDGETS.map((w) => [w.id, w]));
          saved = saved.map((w: any) => {
            const def = defMap.get(w.id);
            return def && (w.rowSpan || 0) < def.rowSpan ? { ...w, rowSpan: def.rowSpan } : w;
          });
          setWidgets(saved);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch (e) {}
  }, [widgets]);

  const update = (id: string, patch: Partial<Widget>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };
  const reorder = (id: string, delta: number) => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      const target = idx + delta;
      if (idx < 0 || target < 0 || target >= sorted.length) return prev;
      [sorted[idx].order, sorted[target].order] = [sorted[target].order, sorted[idx].order];
      return sorted;
    });
  };

  const goTo = useCallback((page: string, arg?: string | number) => {
    router.push(arg !== undefined ? `/${page}/${arg}` : `/${page}`);
  }, [router]);

  const sorted = useMemo(() => [...widgets].sort((a, b) => a.order - b.order), [widgets]);

  return (
    <div style={{ padding: '16px 24px 60px' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text)', fontWeight: 800 }}>لوحة قدراتك</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {editMode ? (
            <button onClick={() => setShowReset(true)} style={btnSec}>إعادة تعيين</button>
          ) : null}
          <button onClick={() => setEditMode(!editMode)} style={editMode ? btnPri : btnGh}>
            {editMode ? '✓ تم' : '✎ تعديل'}
          </button>
        </div>
      </div>

      {!data ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text)', opacity: 0.5 }}>جارٍ التحميل...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: 60, gap: 12 }}>
          {sorted.map((w) => {
            const meta = WIDGET_META[w.id] || { title: w.id, accent: '#06B6D4' };
            return (
              <div key={w.id} style={{
                gridColumn: `span ${w.colSpan}`,
                gridRow: `span ${w.rowSpan}`,
                background: 'color-mix(in srgb, var(--surface, #0f1419) 100%, transparent)',
                border: editMode ? `2px dashed ${meta.accent}` : '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
                borderRadius: 14,
                padding: 16,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.accent }} />
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{meta.title}</h3>
                    {editMode ? <span style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, fontFamily: 'monospace' }}>{w.colSpan}×{w.rowSpan}</span> : null}
                  </div>
                  {editMode ? (
                    <div style={{ display: 'flex', gap: 3 }}>
                      <Btn label="−⇔" onClick={() => update(w.id, { colSpan: Math.max(1, w.colSpan - 1) })} />
                      <Btn label="+⇔" onClick={() => update(w.id, { colSpan: Math.min(12, w.colSpan + 1) })} />
                      <Btn label="−⇕" onClick={() => update(w.id, { rowSpan: Math.max(1, w.rowSpan - 1) })} />
                      <Btn label="+⇕" onClick={() => update(w.id, { rowSpan: Math.min(15, w.rowSpan + 1) })} />
                      <Btn label="↑" onClick={() => reorder(w.id, -1)} />
                      <Btn label="↓" onClick={() => reorder(w.id, 1)} />
                    </div>
                  ) : null}
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  {w.id === 'kpis' ? <KpisW data={data} goTo={goTo} /> :
                   w.id === 'programs' ? <ProgramsW data={data} goTo={goTo} /> :
                   w.id === 'live' ? <LiveW data={data} goTo={goTo} /> :
                   w.id === 'tasks' ? <TasksW data={data} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showReset ? (
        <div onClick={() => setShowReset(false)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={modalBox} dir="rtl">
            <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 16 }}>إعادة تعيين التخطيط؟</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text)', opacity: 0.7 }}>سيتم استعادة الأحجام والترتيب الافتراضي.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReset(false)} style={btnGh}>إلغاء</button>
              <button onClick={() => { setWidgets(DEFAULT_WIDGETS); setShowReset(false); }} style={btnPri}>إعادة تعيين</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Btn({ label, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      minWidth: 26, height: 22, fontSize: 10, padding: '0 6px',
      background: 'color-mix(in srgb, var(--text) 10%, transparent)',
      color: 'var(--text)',
      border: '1px solid color-mix(in srgb, var(--text) 18%, transparent)',
      borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace',
    }}>{label}</button>
  );
}

function KpisW({ data, goTo }: { data: DashData; goTo: any }) {
  const kActive = useCounter(data.kpis.active);
  const kTrainees = useCounter(data.kpis.total_attendees);
  const kPending = useCounter(data.kpis.pending);
  const kComp = useCounter(data.kpis.avg_completion);

  const cards = [
    { label: 'البرامج النشطة', value: String(kActive), sub: '+12% vs Q4 2025', icon: 'book', color: '#06B6D4', to: 'programs' },
    { label: 'إجمالي المتدربين', value: fmt(kTrainees), sub: 'النشطين', icon: 'users', color: '#7C3AED', to: 'contacts' },
    { label: 'طلبات معلّقة', value: String(kPending), sub: 'تحتاج مراجعة', icon: 'inbox', color: '#F59E0B', to: 'nominations' },
    { label: 'نسبة الإنجاز', value: `${kComp}%`, sub: 'في المسار', icon: 'target', color: '#10B981', to: null },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, height: '100%' }}>
      {cards.map((c) => <KpiCard key={c.label} {...c} onClick={c.to ? () => goTo(c.to) : null} />)}
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: hover
        ? `linear-gradient(135deg, color-mix(in srgb, ${color} 22%, transparent), color-mix(in srgb, ${color} 8%, transparent))`
        : `linear-gradient(135deg, color-mix(in srgb, ${color} 10%, transparent), color-mix(in srgb, ${color} 3%, transparent))`,
      border: `1px solid color-mix(in srgb, ${color} ${hover ? 48 : 20}%, transparent)`,
      borderRadius: 10, padding: '12px 14px',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.22s', transform: hover && onClick ? 'translateY(-2px)' : 'none',
      boxShadow: hover && onClick ? `0 8px 22px color-mix(in srgb, ${color} 24%, transparent)` : 'none',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{
        position: 'absolute', top: -12, insetInlineEnd: -12,
        width: hover ? 80 : 56, height: hover ? 80 : 56,
        borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in srgb, ${color} ${hover ? 32 : 16}%, transparent), transparent 70%)`,
        pointerEvents: 'none', transition: 'all 0.3s',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text)', opacity: 0.72, fontWeight: 600 }}>{label}</span>
        <span style={{ color, opacity: 0.85 }}><QIcon n={icon} size={14}/></span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 28, fontWeight: 800, color, lineHeight: 1.05,
          letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums',
          textShadow: hover ? `0 0 18px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
          transition: 'text-shadow 0.22s',
        }}>{value}</div>
        {sub ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6, marginTop: 3 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

function ProgramsW({ data, goTo }: any) {
  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--text) 10%, transparent)' }}>
            <th style={thStyle}>الرمز</th>
            <th style={thStyle}>البرنامج</th>
            <th style={thStyle}>الحالة</th>
            <th style={thStyle}>السعة</th>
            <th style={thStyle}>التقدّم</th>
          </tr>
        </thead>
        <tbody>
          {data.programs.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: 'var(--text)', opacity: 0.5 }}>لا توجد برامج نشطة</td></tr>
          ) : data.programs.map((p: any) => {
            const meta = STATUS_META[p.status || 'execution'] || STATUS_META.execution || { ar: '—', class: '' };
            const cap = p.capacity || 0;
            const enr = p.enrolled_count || p.attendees || 0;
            const fillPct = cap > 0 ? Math.round((enr / cap) * 100) : 0;
            return <ProgramRow key={p.id} p={p} meta={meta} cap={cap} enr={enr} fillPct={fillPct} onClick={() => goTo('programs', p.id)} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProgramRow({ p, meta, cap, enr, fillPct, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      cursor: 'pointer',
      background: hover ? 'color-mix(in srgb, #10B981 8%, transparent)' : 'transparent',
      transition: 'all 0.15s',
    }}>
      <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text)', opacity: 0.7 }}>{p.code || `#${p.id}`}</td>
      <td style={{ ...tdStyle, color: 'var(--text)', fontWeight: 600 }}>{p.title_ar}</td>
      <td style={tdStyle}>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: 'color-mix(in srgb, #06B6D4 16%, transparent)', color: '#06B6D4', fontWeight: 600 }}>{meta.ar}</span>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
          <div style={{ flex: 1, height: 5, background: 'color-mix(in srgb, var(--text) 8%, transparent)', borderRadius: 4, overflow: 'hidden', maxWidth: 80 }}>
            <div style={{ height: '100%', width: `${fillPct}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text)', opacity: 0.7, fontFamily: 'monospace' }}>{enr}/{cap || '\u221E'}</span>
        </div>
      </td>
      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: fillPct > 50 ? '#10B981' : 'var(--text)', fontWeight: 700 }}>{fillPct}%</td>
    </tr>
  );
}

function LiveW({ data, goTo }: any) {
  const live = data.live;
  const [hover, setHover] = useState(false);
  if (!live) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text)', opacity: 0.5, fontSize: 12 }}>لا يوجد برنامج جارٍ</div>;
  }

  let elapsed = 0, total = 1, pct = 0;
  if (live.start_date && live.end_date) {
    const start = new Date(live.start_date).getTime();
    const end = new Date(live.end_date).getTime();
    const now = Date.now();
    total = Math.max(1, Math.ceil((end - start) / 86400000));
    elapsed = Math.max(0, Math.ceil((now - start) / 86400000));
    pct = Math.min(100, Math.round((elapsed / total) * 100));
  }

  return (
    <div onClick={() => goTo('programs', live.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: hover
        ? 'linear-gradient(135deg, color-mix(in srgb, #F59E0B 24%, transparent), color-mix(in srgb, #F59E0B 8%, transparent))'
        : 'linear-gradient(135deg, color-mix(in srgb, #F59E0B 12%, transparent), color-mix(in srgb, #F59E0B 3%, transparent))',
      border: `1px solid color-mix(in srgb, #F59E0B ${hover ? 50 : 22}%, transparent)`,
      borderRadius: 12, padding: 14, cursor: 'pointer',
      transition: 'all 0.22s', transform: hover ? 'translateY(-2px)' : 'none',
      boxShadow: hover ? '0 8px 22px color-mix(in srgb, #F59E0B 24%, transparent)' : 'none',
      height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -16, insetInlineEnd: -16, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, #F59E0B 30%, transparent), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 10px #F59E0B' }} />
          <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, letterSpacing: 0.6 }}>جارٍ الآن</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{live.title_ar}</div>
        {live.code ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, fontFamily: 'monospace' }}>{live.code}</div> : null}
        {live.provider ? <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.7, marginTop: 4 }}>{live.provider}</div> : null}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text)', opacity: 0.7, marginBottom: 4 }}>
          <span>اليوم {elapsed} من {total}</span>
          <span style={{ fontWeight: 700, color: '#F59E0B' }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: 'color-mix(in srgb, var(--text) 8%, transparent)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', transition: 'width 0.3s' }} />
        </div>
        {live.capacity ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6, marginTop: 6, fontFamily: 'monospace' }}>{live.enrolled_count}/{live.capacity}</div> : null}
      </div>
    </div>
  );
}

function TasksW({ data }: any) {
  const tasks = data.tasks || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', overflow: 'auto' }}>
      {tasks.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text)', opacity: 0.5, fontSize: 12 }}>لا توجد مهام</div>
      ) : tasks.slice(0, 8).map((t: any) => <TaskRow key={t.id} t={t} />)}
    </div>
  );
}

function TaskRow({ t }: any) {
  const [hover, setHover] = useState(false);
  const dueColor = t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#F59E0B' : 'var(--text)';
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px',
      background: hover ? 'color-mix(in srgb, #EF4444 10%, transparent)' : 'color-mix(in srgb, var(--text) 4%, transparent)',
      border: '1px solid color-mix(in srgb, var(--text) 6%, transparent)',
      borderRadius: 8, transition: 'all 0.15s',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
        {t.program ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6 }}>{t.program}</div> : null}
      </div>
      <div style={{ fontSize: 10, color: dueColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.due}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'start', fontSize: 11, color: 'var(--text)',
  opacity: 0.65, fontWeight: 700, letterSpacing: 0.3,
};
const tdStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12,
  borderBottom: '1px solid color-mix(in srgb, var(--text) 5%, transparent)',
};
const btnPri: React.CSSProperties = {
  padding: '7px 14px', fontSize: 12, fontWeight: 700,
  background: 'linear-gradient(135deg, #06B6D4, #7C3AED)',
  color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer',
};
const btnGh: React.CSSProperties = {
  padding: '7px 14px', fontSize: 12, fontWeight: 600,
  background: 'color-mix(in srgb, var(--text) 8%, transparent)',
  color: 'var(--text)',
  border: '1px solid color-mix(in srgb, var(--text) 15%, transparent)',
  borderRadius: 8, cursor: 'pointer',
};
const btnSec: React.CSSProperties = {
  padding: '7px 14px', fontSize: 12, fontWeight: 600,
  background: 'transparent', color: '#EF4444',
  border: '1px solid #EF4444', borderRadius: 8, cursor: 'pointer',
};
const modalBg: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
};
const modalBox: React.CSSProperties = {
  background: 'var(--surface, #0f1419)',
  border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)',
  borderRadius: 12, padding: 20, maxWidth: 380, width: '100%',
};
