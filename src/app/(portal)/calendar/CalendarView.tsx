'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Calendar as CalIcon, X,
  CalendarDays, List, Grid3x3, AlertTriangle, MapPin, Globe, Monitor, Building,
} from 'lucide-react';

interface SerializedEvent {
  id: string;
  type: 'program' | 'study' | 'consultation' | 'monday_task' | 'personal';
  title: string;
  date: string;
  endDate?: string;
  source: string;
  status?: string;
  priority?: string;
  url?: string;
  meta?: Record<string, unknown>;
  isAssigned?: boolean;
  crossTenant?: boolean;
  formatCode?: string;
  formatName?: string;
}

// ألوان حسب نوع البرنامج (لـ qtech)
const FORMAT_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  PROG_LOCAL:    { bg: 'rgba(0,171,175,0.14)',   fg: '#00abaf', dot: '#00abaf' },  // محلي - تركواز
  PROG_INTL:     { bg: 'rgba(124,50,201,0.14)',  fg: '#7c32c9', dot: '#7c32c9' },  // دولي - بنفسجي
  WORKSHOP:      { bg: 'rgba(28,193,130,0.14)',  fg: '#1cc182', dot: '#1cc182' },  // ورشة - أخضر
  WEBINAR:       { bg: 'rgba(0,221,221,0.14)',   fg: '#00DDDD', dot: '#00DDDD' },  // ندوة افتراضية - تركواز فاتح
  SEMINAR:       { bg: 'rgba(255,170,0,0.14)',   fg: '#FFAA00', dot: '#FFAA00' },  // ندوة معرفية - برتقالي
  ONLINE_COURSE: { bg: 'rgba(14,165,233,0.14)',  fg: '#0EA5E9', dot: '#0EA5E9' },  // أونلاين - أزرق
  SKILLS_DEV:    { bg: 'rgba(124,50,201,0.14)',  fg: '#9D4EDD', dot: '#9D4EDD' },  // مهارات - بنفسجي فاتح
  CERT_PROG:     { bg: 'rgba(255,107,107,0.14)', fg: '#FF6B6B', dot: '#FF6B6B' },  // شهادة - أحمر
  BOOTCAMP:      { bg: 'rgba(255,123,80,0.14)',  fg: '#FF7B50', dot: '#FF7B50' },  // معسكر - برتقالي محمر
  MENTORSHIP:    { bg: 'rgba(42,32,106,0.14)',   fg: '#2A206A', dot: '#2A206A' },  // إرشاد - نيلي
};

const FORMAT_LABELS_AR: Record<string, string> = {
  PROG_LOCAL:    'محلي',
  PROG_INTL:     'دولي',
  WORKSHOP:      'ورشة',
  WEBINAR:       'ندوة افتراضية',
  SEMINAR:       'ندوة معرفية',
  ONLINE_COURSE: 'أونلاين',
  SKILLS_DEV:    'تطوير مهارات',
  CERT_PROG:     'شهادة',
  BOOTCAMP:      'معسكر',
  MENTORSHIP:    'إرشاد',
};

const COLORS: Record<SerializedEvent['type'], { bg: string; fg: string; dot: string; soft: string }> = {
  program:      { bg: 'rgba(0,171,175,0.10)',  fg: '#00abaf', dot: '#00abaf', soft: 'rgba(0,171,175,0.05)' },
  study:        { bg: 'rgba(124,50,201,0.10)', fg: '#7c32c9', dot: '#7c32c9', soft: 'rgba(124,50,201,0.05)' },
  consultation: { bg: 'rgba(28,193,130,0.10)', fg: '#1cc182', dot: '#1cc182', soft: 'rgba(28,193,130,0.05)' },
  monday_task:  { bg: 'rgba(255,123,80,0.10)', fg: '#ff7b50', dot: '#ff7b50', soft: 'rgba(255,123,80,0.05)' },
  personal:     { bg: 'rgba(42,32,106,0.10)',  fg: '#2a206a', dot: '#2a206a', soft: 'rgba(42,32,106,0.05)' },
};

/**
 * يرجع ألوان الحدث حسب البوابة:
 * - qtech: حسب formatCode (محلي/دولي/ورشة/ندوة/...)
 * - غيرها: حسب type (program/study/consultation/...)
 */
function getEventColors(ev: SerializedEvent, tenantId: string) {
  if (tenantId === 'qtech' && ev.type === 'program' && ev.formatCode && FORMAT_COLORS[ev.formatCode]) {
    const fc = FORMAT_COLORS[ev.formatCode];
    return { bg: fc.bg, fg: fc.fg, dot: fc.dot, soft: fc.bg };
  }
  return COLORS[ev.type];
}

const TYPE_LABELS = {
  program:      'برنامج',
  study:        'دراسة',
  consultation: 'استشارة',
  monday_task:  'مهمة',
  personal:     'شخصي',
};

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_WEEKDAYS_FULL = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function getEventLabel(ev: SerializedEvent, tenantId: string): string {
  if (tenantId === 'qtech' && ev.formatName) return ev.formatName;
  return TYPE_LABELS[ev.type];
}

interface Props {
  year: number;
  month: number;
  events: SerializedEvent[];
  tenantId: string;
}

type ViewMode = 'month' | 'list' | 'week';

export function CalendarView({ year, month, events, tenantId }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<SerializedEvent | null>(null);
  const [view, setView] = useState<ViewMode>('month');

  // ────────────────────────────────────────────────────────────────────────────
  const monthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [events, month, year]);

  const stats = useMemo(() => ({
    total:        monthEvents.length,
    programs:     monthEvents.filter((e) => e.type === 'program').length,
    studies:      monthEvents.filter((e) => e.type === 'study').length,
    consultations: monthEvents.filter((e) => e.type === 'consultation').length,
  }), [monthEvents]);

  const today = new Date();
  const prevHref  = `/calendar?year=${month === 0 ? year - 1 : year}&month=${month === 0 ? 11 : month - 1}`;
  const nextHref  = `/calendar?year=${month === 11 ? year + 1 : year}&month=${month === 11 ? 0 : month + 1}`;
  const todayHref = `/calendar?year=${today.getFullYear()}&month=${today.getMonth()}`;

  return (
    <div>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CalIcon size={28} style={{ color: 'var(--primary)' }} />
            التقويم الشهري
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
            {ARABIC_MONTHS[month]} {year} · {stats.total} حدث
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface-2)', borderRadius: 10 }}>
          <ViewBtn active={view === 'month'} onClick={() => setView('month')} icon={Grid3x3} label="شهري" />
          <ViewBtn active={view === 'week'}  onClick={() => setView('week')}  icon={CalendarDays} label="أسبوعي" />
          <ViewBtn active={view === 'list'}  onClick={() => setView('list')}  icon={List} label="قائمة" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href={prevHref} className="btn btn-ghost" style={{ padding: 10 }}><ChevronRight size={18} /></Link>
          <Link href={todayHref} className="btn btn-secondary" style={{ minWidth: 80 }}>اليوم</Link>
          <Link href={nextHref} className="btn btn-ghost" style={{ padding: 10 }}><ChevronLeft size={18} /></Link>
        </div>
      </div>

      {/* ─── Legend ─── */}
      <div style={{
        display: 'flex', gap: 14, marginBottom: 20, padding: '14px 18px',
        background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line-soft)',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {tenantId === 'qtech' ? (
          // legend for qtech: by program format
          (() => {
            const counts: Record<string, number> = {};
            monthEvents.forEach((e) => {
              if (e.type === 'program' && e.formatCode) {
                counts[e.formatCode] = (counts[e.formatCode] || 0) + 1;
              }
            });
            const presentFormats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
            if (presentFormats.length === 0) {
              return <span style={{ fontSize: 13, color: 'var(--text-3)' }}>لا توجد برامج هذا الشهر</span>;
            }
            return presentFormats.map((fc) => {
              const colors = FORMAT_COLORS[fc] || COLORS.program;
              const label = FORMAT_LABELS_AR[fc] || fc;
              return (
                <div key={fc} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: colors.dot }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>· {counts[fc]}</span>
                </div>
              );
            });
          })()
        ) : (
          // legend for omary/advice: by event type
          (Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((type) => {
            const count = monthEvents.filter((e) => e.type === type).length;
            if (count === 0 && (type === 'monday_task' || type === 'personal')) return null;
            const c = COLORS[type];
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.dot }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{TYPE_LABELS[type]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>· {count}</span>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Views ─── */}
      {view === 'month' && <MonthView year={year} month={month} events={events} onSelect={setSelectedEvent} tenantId={tenantId} />}
      {view === 'week'  && <WeekView year={year} month={month} events={events} onSelect={setSelectedEvent} tenantId={tenantId} />}
      {view === 'list'  && <ListView events={monthEvents} onSelect={setSelectedEvent} tenantId={tenantId} />}

      {/* ─── Modal ─── */}
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} tenantId={tenantId} />}
    </div>
  );
}

// ============================================================================
// ViewBtn — أيقونة تبديل العرض
// ============================================================================
function ViewBtn({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: typeof Grid3x3; label: string;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 8,
      background: active ? 'var(--surface)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-3)',
      fontSize: 13, fontWeight: active ? 600 : 500,
      border: 'none', cursor: 'pointer',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      transition: 'all 160ms',
    }}>
      <Icon size={15} />
      {label}
    </button>
  );
}

// ============================================================================
// عرض شهري
// ============================================================================
function MonthView({ year, month, events, onSelect, tenantId }: {
  year: number; month: number; events: SerializedEvent[]; onSelect: (e: SerializedEvent) => void; tenantId: string;
}) {
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const cells: Array<{ date: Date; inMonth: boolean; events: SerializedEvent[] }> = [];

    for (let i = startWeekday; i > 0; i--) {
      cells.push({ date: new Date(year, month, 1 - i), inMonth: false, events: [] });
    }
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true, events: [] });
    }
    while (cells.length % 7 !== 0 || cells.length < 35) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last); next.setDate(next.getDate() + 1);
      cells.push({ date: next, inMonth: false, events: [] });
      if (cells.length >= 42) break;
    }
    for (const ev of events) {
      const evDate = new Date(ev.date);
      const cell = cells.find(
        (c) => c.date.getFullYear() === evDate.getFullYear() &&
               c.date.getMonth()    === evDate.getMonth()    &&
               c.date.getDate()     === evDate.getDate()
      );
      if (cell) cell.events.push(ev);
    }
    return cells;
  }, [year, month, events]);

  const today = new Date();

  return (
    <div className="card-bordered" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
        {ARABIC_WEEKDAYS_FULL.map((d) => (
          <div key={d} style={{
            padding: '12px 8px', textAlign: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
            letterSpacing: '0.05em', fontFamily: 'var(--font-display)',
          }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {grid.map((cell, idx) => {
          const isToday = cell.date.getFullYear() === today.getFullYear() &&
                          cell.date.getMonth()    === today.getMonth() &&
                          cell.date.getDate()     === today.getDate();
          const isFriday = cell.date.getDay() === 5;

          return (
            <div key={idx} style={{
              minHeight: 110, padding: 8,
              borderInlineEnd: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--line-soft)',
              borderBottom: idx < grid.length - 7 ? '1px solid var(--line-soft)' : 'none',
              background: !cell.inMonth ? 'var(--surface-2)' : isToday ? 'rgba(0,171,175,0.04)' : 'transparent',
              opacity: cell.inMonth ? 1 : 0.45,
            }}>
              <div style={{ marginBottom: 6 }}>
                <span style={{
                  fontSize: 13, fontFamily: 'var(--font-mono)',
                  minWidth: 26, height: 26, padding: '0 8px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 13,
                  background: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? '#fff' : isFriday ? 'var(--danger)' : 'var(--text-2)',
                  fontWeight: isToday ? 700 : 500,
                }}>
                  {cell.date.getDate()}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {cell.events.slice(0, 3).map((ev) => {
                  const c = getEventColors(ev, tenantId);
                  return (
                    <button key={ev.id} onClick={() => onSelect(ev)} style={{
                      all: 'unset', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                      background: c.bg, color: c.fg, fontSize: 11, lineHeight: 1.4,
                      borderInlineStart: `2px solid ${c.dot}`, fontWeight: 500,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }} title={ev.title}>{ev.title}</button>
                  );
                })}
                {cell.events.length > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', padding: '0 8px' }}>
                    +{cell.events.length - 3} المزيد
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// عرض أسبوعي
// ============================================================================
function WeekView({ year, month, events, onSelect, tenantId }: {
  year: number; month: number; events: SerializedEvent[]; onSelect: (e: SerializedEvent) => void; tenantId: string;
}) {
  const today = new Date();
  const refDate = today.getFullYear() === year && today.getMonth() === month ? today : new Date(year, month, 1);
  const dayOfWeek = refDate.getDay();
  const weekStart = new Date(refDate);
  weekStart.setDate(refDate.getDate() - dayOfWeek);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="card-bordered" style={{ padding: 0 }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--line-soft)',
        fontSize: 14, color: 'var(--text-2)',
      }}>
        أسبوع {days[0].toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })} —{' '}
        {days[6].toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((d, i) => {
          const dayEvents = events.filter((e) => {
            const ed = new Date(e.date);
            return ed.getFullYear() === d.getFullYear() &&
                   ed.getMonth()    === d.getMonth() &&
                   ed.getDate()     === d.getDate();
          });
          const isToday = today.toDateString() === d.toDateString();
          return (
            <div key={i} style={{
              minHeight: 280, padding: 14,
              borderInlineEnd: i < 6 ? '1px solid var(--line-soft)' : 'none',
              background: isToday ? 'rgba(0,171,175,0.04)' : 'transparent',
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                  {ARABIC_WEEKDAYS_FULL[i]}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)',
                  color: isToday ? 'var(--primary)' : 'var(--text)',
                }}>
                  {d.getDate()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayEvents.map((ev) => {
                  const c = getEventColors(ev, tenantId);
                  return (
                    <button key={ev.id} onClick={() => onSelect(ev)} style={{
                      all: 'unset', cursor: 'pointer',
                      padding: '8px 10px', borderRadius: 6,
                      background: c.bg, borderInlineStart: `3px solid ${c.dot}`,
                      fontSize: 12, color: c.fg, fontWeight: 500,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 2, lineHeight: 1.4 }}>{ev.title}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{getEventLabel(ev, tenantId)}</div>
                    </button>
                  );
                })}
                {dayEvents.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// عرض قائمة + side panel للأولويات
// ============================================================================
function ListView({ events, onSelect, tenantId }: {
  events: SerializedEvent[]; onSelect: (e: SerializedEvent) => void; tenantId: string;
}) {
  // أولويات: دراسات حرجة + استشارات قريبة + برامج دولية
  const priorities = useMemo(() => {
    return events
      .filter((e) =>
        (e.type === 'study' && (e.priority === 'critical' || e.priority === 'high')) ||
        (e.type === 'consultation' && e.status === 'scheduled') ||
        (e.type === 'program' && (e.meta as any)?.scope === 'international')
      )
      .sort((a, b) => {
        if (a.priority && b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 8);
  }, [events]);

  // group by day
  const grouped = useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const e of events) {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([k, v]) => ({ date: new Date(k), events: v }));
  }, [events]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: 20, alignItems: 'flex-start' }}>
      {/* الأحداث مرتّبة */}
      <div className="card-bordered" style={{ overflow: 'hidden' }}>
        {grouped.length === 0 ? (
          <div className="empty">
            <CalIcon className="empty-icon" />
            <div className="empty-title">لا توجد أحداث في هذا الشهر</div>
          </div>
        ) : grouped.map((g, idx) => (
          <div key={idx}>
            <div style={{
              padding: '14px 18px', background: 'var(--surface-2)',
              borderBottom: '1px solid var(--line-soft)',
              fontSize: 12, color: 'var(--text-3)', fontWeight: 600,
              fontFamily: 'var(--font-display)',
            }}>
              {g.date.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {g.events.map((ev) => {
              const c = getEventColors(ev, tenantId);
              const meta = ev.meta as any;
              return (
                <button key={ev.id} onClick={() => onSelect(ev)} style={{
                  all: 'unset', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 14,
                  padding: '14px 18px', width: '100%', boxSizing: 'border-box',
                  borderBottom: '1px solid var(--line-soft)',
                  borderInlineStart: `3px solid ${ev.crossTenant ? '#ff7b50' : c.dot}`,
                  background: ev.crossTenant ? 'rgba(255,123,80,0.03)' : 'transparent',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: c.bg, color: c.fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    fontFamily: 'var(--font-display)',
                  }}>{getEventLabel(ev, tenantId)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>{ev.source}</span>
                      {meta?.delivery_mode && <span>· {meta.delivery_mode === 'in_person' ? 'حضوري' : meta.delivery_mode === 'online' ? 'أونلاين' : 'مدمج'}</span>}
                      {meta?.scope === 'international' && <span style={{ color: 'var(--accent)' }}>· دولي 🌍</span>}
                      {meta?.location && <span>· {meta.location}</span>}
                      {ev.priority === 'critical' && <span style={{ color: 'var(--danger)' }}>· أولوية حرجة</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Priority sidebar */}
      <div className="card-bordered" style={{ position: 'sticky', top: 100 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span className="card-title">أولويات الشهر</span>
          </div>
          <span className="badge badge-warning">{priorities.length}</span>
        </div>
        {priorities.length === 0 ? (
          <div className="empty">
            <div className="empty-title">لا أولويات حرجة</div>
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {priorities.map((ev) => {
              const c = getEventColors(ev, tenantId);
              return (
                <button key={ev.id} onClick={() => onSelect(ev)} style={{
                  all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
                  padding: 12, borderRadius: 8, marginBottom: 4,
                  background: c.soft, boxSizing: 'border-box',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
                    <span style={{ fontSize: 10, color: c.fg, fontWeight: 600, textTransform: 'uppercase' }}>
                      {getEventLabel(ev, tenantId)}
                    </span>
                    {ev.priority === 'critical' && (
                      <span style={{ fontSize: 9, color: 'var(--danger)', marginInlineStart: 'auto' }}>● حرجة</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {new Date(ev.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Event Modal
// ============================================================================
function EventModal({ event, onClose, tenantId }: { event: SerializedEvent; onClose: () => void; tenantId: string }) {
  const c = getEventColors(event, tenantId);
  const meta = event.meta as any;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        maxWidth: 520, width: '100%', padding: 28, position: 'relative',
        background: 'var(--surface)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, left: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4,
        }}><X size={18} /></button>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: c.bg, color: c.fg,
          fontSize: 11, fontWeight: 600, marginBottom: 14,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
          {getEventLabel(event, tenantId)}
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 10, fontWeight: 600 }}>{event.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>{event.source}</p>

        {event.crossTenant && (
          <div style={{
            padding: '10px 14px', marginBottom: 12,
            background: 'rgba(255,123,80,0.08)', borderRadius: 8,
            border: '1px solid rgba(255,123,80,0.2)',
            fontSize: 12, color: '#ff7b50', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🔗 مهمة من بوابة أخرى — أنت مُسند كـ{event.source.split('· ')[1] || 'مساهم'}
          </div>
        )}

        <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>التاريخ</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {new Date(event.date).toLocaleDateString('ar-SA', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
            {event.endDate && ' — ' + new Date(event.endDate).toLocaleDateString('ar-SA')}
          </div>
        </div>

        {meta && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {meta.delivery_mode && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {meta.delivery_mode === 'in_person' ? <Building size={12} /> : meta.delivery_mode === 'online' ? <Monitor size={12} /> : <Globe size={12} />}
                {meta.delivery_mode === 'in_person' ? 'حضوري' : meta.delivery_mode === 'online' ? 'أونلاين' : 'مدمج'}
              </span>
            )}
            {meta.scope === 'international' && <span className="badge badge-purple">دولي 🌍</span>}
            {meta.scope === 'local' && <span className="badge badge-info">محلي</span>}
            {meta.location && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} />
                {meta.location}
              </span>
            )}
            {meta.service_type && (
              <span className="badge badge-purple">{meta.service_type as string}</span>
            )}
            {meta.format && (
              <span className="badge badge-info">{meta.format as string}</span>
            )}
          </div>
        )}

        {event.url && (
          <Link href={event.url} className="btn btn-primary" style={{ width: '100%' }}>
            فتح التفاصيل الكاملة
          </Link>
        )}
      </div>
    </div>
  );
}
