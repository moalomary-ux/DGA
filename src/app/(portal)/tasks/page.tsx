'use client';
import { useEffect, useState, useMemo } from 'react';

type Task = {
  assignment_id: number;
  role: string;
  role_label: string;
  role_color: string;
  role_icon: string;
  notes: string | null;
  assigned_at: string;
  program_id: number;
  code: string | null;
  title_ar: string;
  status: string;
  status_label: string;
  status_color: string;
  start_date: string | null;
  end_date: string | null;
  enrolled: number;
  capacity: number;
};

type Stats = { total: number; active: number; upcoming: number; overdue: number };
type Filter = 'all' | 'active' | 'upcoming' | 'overdue';

const FILTERS: { id: Filter; label: string; color: string }[] = [
  { id: 'all',      label: 'الكل',     color: '#06B6D4' },
  { id: 'active',   label: 'نشطة',     color: '#F59E0B' },
  { id: 'upcoming', label: 'قريبة',    color: '#7C3AED' },
  { id: 'overdue',  label: 'متأخرة',   color: '#EF4444' },
];

function fmtDate(d: string | null): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    const m = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][date.getMonth()];
    return `${date.getDate()} ${m}`;
  } catch { return d; }
}

function dueLabel(end: string | null, status: string): { label: string; color: string } | null {
  if (!end || status === 'closed') return null;
  try {
    const due = new Date(end);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return { label: `متأخر ${-diff} يوم`, color: '#EF4444' };
    if (diff === 0) return { label: 'ينتهي اليوم', color: '#F59E0B' };
    if (diff === 1) return { label: 'غداً', color: '#F59E0B' };
    if (diff <= 7) return { label: `بعد ${diff} أيام`, color: '#F59E0B' };
    return { label: `بعد ${diff} يوم`, color: '#94a3b8' };
  } catch { return null; }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, upcoming: 0, overdue: 0 });
  const [filter, setFilter] = useState<Filter>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks').then((r) => r.json()).then((d) => {
      if (d.ok) { setTasks(d.tasks || []); setStats(d.stats || stats); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    return tasks.filter((t) => {
      if (filter === 'active' && !['open', 'in_progress'].includes(t.status)) return false;
      if (filter === 'upcoming') {
        if (!t.end_date || t.status === 'closed') return false;
        const due = new Date(t.end_date);
        if (due < now || due > week) return false;
      }
      if (filter === 'overdue') {
        if (!t.end_date || t.status === 'closed') return false;
        if (new Date(t.end_date) >= now) return false;
      }
      if (roleFilter !== 'all' && t.role !== roleFilter) return false;
      return true;
    });
  }, [tasks, filter, roleFilter]);

  const availableRoles = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => s.add(t.role));
    return Array.from(s);
  }, [tasks]);

  const roleMeta: Record<string, { label: string; color: string }> = {};
  tasks.forEach((t) => { roleMeta[t.role] = { label: t.role_label, color: t.role_color }; });

  return (
    <div style={{ padding: '16px 24px 80px', minHeight: '100vh' }} dir="rtl">
      <div style={{
        background: 'linear-gradient(135deg, #06B6D4, #7C3AED)', color: '#fff',
        borderRadius: 16, padding: '24px 28px', marginBottom: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, insetInlineEnd: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>لوحة مهامي</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>المهام المسندة لي</div>
          <div style={{ fontSize: 13, opacity: 0.92 }}>{loading ? 'جاري التحميل...' : `${stats.total} مهمة إجمالاً · ${stats.active} نشطة الآن`}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'إجمالي مهامي', value: stats.total,    color: '#06B6D4' },
          { label: 'نشطة',         value: stats.active,   color: '#F59E0B' },
          { label: 'قريبة (أسبوع)', value: stats.upcoming, color: '#7C3AED' },
          { label: 'متأخرة',        value: stats.overdue,  color: '#EF4444' },
        ].map((c) => (
          <div key={c.label} style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${c.color} 14%, transparent), color-mix(in srgb, ${c.color} 4%, transparent))`,
            border: `1px solid color-mix(in srgb, ${c.color} 22%, transparent)`,
            borderRadius: 12, padding: '14px 18px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.7, marginTop: 6 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '8px 16px',
              background: active ? f.color : 'color-mix(in srgb, var(--text) 8%, transparent)',
              border: `1px solid ${active ? f.color : 'color-mix(in srgb, var(--text) 15%, transparent)'}`,
              borderRadius: 100, fontSize: 12, fontWeight: 600,
              color: active ? '#fff' : 'var(--text)', cursor: 'pointer',
            }}>{f.label}</button>
          );
        })}

        {availableRoles.length > 1 ? (
          <>
            <span style={{ width: 1, height: 20, background: 'color-mix(in srgb, var(--text) 15%, transparent)', margin: '0 6px' }} />
            <button onClick={() => setRoleFilter('all')} style={{
              padding: '7px 14px',
              background: roleFilter === 'all' ? 'color-mix(in srgb, var(--text) 15%, transparent)' : 'transparent',
              border: '1px solid color-mix(in srgb, var(--text) 15%, transparent)',
              borderRadius: 100, fontSize: 11, color: 'var(--text)', cursor: 'pointer',
            }}>كل الأدوار</button>
            {availableRoles.map((r) => {
              const m = roleMeta[r] || { label: r, color: '#94a3b8' };
              const active = roleFilter === r;
              return (
                <button key={r} onClick={() => setRoleFilter(r)} style={{
                  padding: '7px 14px',
                  background: active ? `color-mix(in srgb, ${m.color} 22%, transparent)` : 'transparent',
                  border: `1px solid color-mix(in srgb, ${m.color} ${active ? 50 : 25}%, transparent)`,
                  borderRadius: 100, fontSize: 11, color: m.color, cursor: 'pointer', fontWeight: 600,
                }}>{m.label}</button>
              );
            })}
          </>
        ) : null}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text)', opacity: 0.5 }}>جاري تحميل المهام...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: 'var(--text)', opacity: 0.5,
          background: 'color-mix(in srgb, var(--text) 4%, transparent)',
          borderRadius: 14, border: '1px dashed color-mix(in srgb, var(--text) 15%, transparent)',
        }}>
          <div style={{ fontSize: 42, marginBottom: 14, opacity: 0.4 }}>{'\u2713'}</div>
          <div style={{ fontSize: 14 }}>
            {filter === 'all' ? 'لا توجد مهام مسندة لك حالياً'
              : filter === 'active' ? 'لا توجد مهام نشطة'
              : filter === 'upcoming' ? 'لا توجد مهام قريبة الموعد'
              : 'لا توجد مهام متأخرة، أحسنت!'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((t) => <TaskCard key={t.assignment_id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [hover, setHover] = useState(false);
  const open = () => { if (typeof window !== 'undefined') window.location.href = `/programs/${task.program_id}`; };
  const due = dueLabel(task.end_date, task.status);
  const color = task.role_color;

  return (
    <div onClick={open} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: hover
        ? `linear-gradient(135deg, color-mix(in srgb, ${color} 28%, transparent), color-mix(in srgb, ${color} 10%, transparent))`
        : `linear-gradient(135deg, color-mix(in srgb, ${color} 12%, transparent), color-mix(in srgb, ${color} 4%, transparent))`,
      border: `1px solid color-mix(in srgb, ${color} ${hover ? 55 : 22}%, transparent)`,
      borderRadius: 14, padding: 18, cursor: 'pointer',
      transition: 'all 0.22s', transform: hover ? 'translateY(-3px)' : 'none',
      boxShadow: hover ? `0 10px 28px color-mix(in srgb, ${color} 28%, transparent)` : 'none',
      position: 'relative', overflow: 'hidden',
      minHeight: 180, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', top: -14, insetInlineEnd: -14,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in srgb, ${color} ${hover ? 35 : 18}%, transparent), transparent 70%)`,
        pointerEvents: 'none', transition: 'all 0.3s',
      }} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, position: 'relative', flexWrap: 'wrap' }}>
        <span style={{
          padding: '4px 10px',
          background: `color-mix(in srgb, ${color} 22%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
          borderRadius: 100, fontSize: 10, fontWeight: 700, color,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>{task.role_icon} {task.role_label}</span>
        <span style={{
          padding: '4px 10px',
          background: `color-mix(in srgb, ${task.status_color} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${task.status_color} 30%, transparent)`,
          borderRadius: 100, fontSize: 10, fontWeight: 600, color: task.status_color,
        }}>{task.status_label}</span>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.title_ar}
        </div>
        {task.code ? <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.5, fontFamily: 'monospace', marginBottom: 10 }}>{task.code}</div> : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', marginTop: 12, paddingTop: 12, borderTop: '1px solid color-mix(in srgb, var(--text) 8%, transparent)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {due ? <div style={{ fontSize: 11, color: due.color, fontWeight: 700 }}>{due.label}</div> : null}
          {task.end_date ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.55 }}>{fmtDate(task.start_date)} {'\u2192'} {fmtDate(task.end_date)}</div> : null}
          {task.capacity > 0 ? <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.55 }}>{task.enrolled}/{task.capacity}</div> : null}
        </div>
        <div style={{ color, fontSize: 14, opacity: hover ? 1 : 0.6, transition: 'opacity 0.2s' }}>عرض {'\u2190'}</div>
      </div>
    </div>
  );
}
