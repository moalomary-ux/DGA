'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TeamPanel from './TeamPanel';

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAYS_AR  = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const KIND_META: Record<string, { ar: string; color: string }> = {
  training:     { ar: 'تدريب',   color: '#00ABAF' },
  workshop:     { ar: 'ورشة',    color: '#7C32C9' },
  consultation: { ar: 'استشارة', color: '#F59E0B' },
  meeting:      { ar: 'اجتماع',  color: '#3F7DD9' },
  event:        { ar: 'فعالية',  color: '#EF4444' },
};

// إجازات القطاع الحكومي السعودي (هيئة الخدمة المدنية)
// مصادر رسمية: إعلانات مجلس الوزراء + وزارة الموارد البشرية
const SAUDI_HOLIDAYS = [
  // 2025
  { start: '2025-02-22', days: 1, name: 'يوم التأسيس',  type: 'founding'  },
  { start: '2025-03-30', days: 4, name: 'عيد الفطر',    type: 'religious' },
  { start: '2025-06-05', days: 5, name: 'عيد الأضحى',   type: 'religious' }, // وقفة عرفة + 4 أيام عيد
  { start: '2025-09-23', days: 1, name: 'اليوم الوطني', type: 'national'  },
  // 2026
  { start: '2026-02-22', days: 1, name: 'يوم التأسيس',  type: 'founding'  },
  { start: '2026-03-19', days: 4, name: 'عيد الفطر',    type: 'religious' },
  { start: '2026-05-26', days: 5, name: 'عيد الأضحى',   type: 'religious' }, // 26 مايو (وقفة عرفة) → 30 مايو
  { start: '2026-09-23', days: 1, name: 'اليوم الوطني', type: 'national'  },
];

const HOLIDAY_COLORS: Record<string, string> = {
  founding:  '#3F7DD9',
  national:  '#10B981',
  religious: '#F59E0B',
};
const HOLIDAY_LABELS: Record<string, string> = {
  founding:  'تأسيس',
  national:  'وطنية',
  religious: 'دينية',
};
const TEAM_DOT_COLOR = '#A855F7';

function fmtKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function relativeDay(d: Date, today: Date): string {
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0)  return 'اليوم';
  if (diff === 1)  return 'غداً';
  if (diff === -1) return 'أمس';
  if (diff > 1 && diff < 7)   return `بعد ${diff} أيام`;
  if (diff < -1 && diff > -7) return `قبل ${Math.abs(diff)} أيام`;
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [programs, setPrograms] = useState<any[]>([]);
  const [teamRecords, setTeamRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(fmtKey(new Date()));
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [scope, setScope] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetch('/api/programs/list')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (Array.isArray(d?.programs)) setPrograms(d.programs);
        else if (Array.isArray(d))      setPrograms(d);
        else if (Array.isArray(d?.data)) setPrograms(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/team/availability?mode=admin')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && Array.isArray(d.records)) setTeamRecords(d.records); })
      .catch(() => {});
  }, []);

  const holidayDates = useMemo(() => {
    const map: Record<string, { name: string; type: string }> = {};
    for (const h of SAUDI_HOLIDAYS) {
      try {
        const start = new Date(h.start + 'T00:00:00');
        const days = h.days || 1;
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          map[fmtKey(d)] = { name: h.name, type: h.type };
        }
      } catch {}
    }
    return map;
  }, []);

  const teamDates = useMemo(() => {
    const set = new Set<string>();
    for (const r of teamRecords) {
      if (!r || !r.start_date || !r.end_date) continue;
      try {
        const s = new Date(String(r.start_date).slice(0,10) + 'T00:00:00');
        const e = new Date(String(r.end_date).slice(0,10) + 'T00:00:00');
        const cur = new Date(s);
        while (cur <= e) { set.add(fmtKey(cur)); cur.setDate(cur.getDate() + 1); }
      } catch {}
    }
    return set;
  }, [teamRecords]);

  const miniCells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { d: number; m: number; y: number; muted: boolean }[] = [];
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ d: prevDays - i, m: viewMonth === 0 ? 11 : viewMonth - 1, y: viewMonth === 0 ? viewYear - 1 : viewYear, muted: true });
    }
    for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, m: viewMonth, y: viewYear, muted: false });
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ d: i, m: viewMonth === 11 ? 0 : viewMonth + 1, y: viewMonth === 11 ? viewYear + 1 : viewYear, muted: true });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const eventsByDate = useMemo(() => {
    const acc: Record<string, any[]> = {};
    for (const p of (programs || [])) {
      if (!p?.start_date) continue;
      const key = String(p.start_date).slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
    }
    return acc;
  }, [programs]);

  const filteredDates = useMemo(() => {
    const eventKeys = Object.keys(eventsByDate);
    const holidayKeys = Object.keys(holidayDates);
    let keys = Array.from(new Set([...eventKeys, ...holidayKeys]));
    if (scope === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      keys = keys.filter(k => { const d = new Date(k); return d >= start && d <= end; });
    } else if (scope === 'quarter') {
      const qStart = Math.floor(viewMonth / 3) * 3;
      const qEnd = qStart + 2;
      keys = keys.filter(k => {
        const d = new Date(k);
        return d.getFullYear() === viewYear && d.getMonth() >= qStart && d.getMonth() <= qEnd;
      });
    } else {
      keys = keys.filter(k => { const d = new Date(k); return d.getMonth() === viewMonth && d.getFullYear() === viewYear; });
    }
    return keys.sort();
  }, [eventsByDate, holidayDates, scope, viewMonth, viewYear, today]);

  const datesByMonth = useMemo(() => {
    const groups: { monthKey: string; dates: string[] }[] = [];
    if (scope === 'quarter') {
      // في الربع: اعرض كل أشهر الربع (3 أشهر) حتى لو فاضية
      const qStart = Math.floor(viewMonth / 3) * 3;
      for (let m = qStart; m <= qStart + 2; m++) {
        const monthKey = `${viewYear}-${String(m).padStart(2,'0')}`;
        const dates = filteredDates.filter(k => {
          const d = new Date(k);
          return d.getMonth() === m && d.getFullYear() === viewYear;
        });
        groups.push({ monthKey, dates });
      }
    } else {
      const map: Record<string, string[]> = {};
      for (const k of filteredDates) {
        const d = new Date(k);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
        if (!map[monthKey]) { map[monthKey] = []; groups.push({ monthKey, dates: map[monthKey] }); }
        map[monthKey].push(k);
      }
    }
    return groups;
  }, [scope, filteredDates, viewMonth, viewYear]);

  const monthEventsCount = useMemo(() => {
    return Object.keys(eventsByDate).filter(k => {
      const d = new Date(k);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    }).length;
  }, [eventsByDate, viewMonth, viewYear]);

  // Holiday types present in current view (for adaptive legend)
  const visibleHolidayTypes = useMemo(() => {
    const types = new Set<string>();
    for (const k of filteredDates) {
      const h = holidayDates[k];
      if (h) types.add(h.type);
    }
    return Array.from(types);
  }, [filteredDates, holidayDates]);

  const cellKey   = (c: { d: number; m: number; y: number }) => `${c.y}-${String(c.m+1).padStart(2,'0')}-${String(c.d).padStart(2,'0')}`;
  const isToday   = (c: { d: number; m: number; y: number }) => c.d === today.getDate() && c.m === today.getMonth() && c.y === today.getFullYear();
  const isSelected= (c: { d: number; m: number; y: number }) => cellKey(c) === selectedDate;
  const hasEvent  = (c: { d: number; m: number; y: number }) => !!eventsByDate[cellKey(c)];
  const getHoliday= (c: { d: number; m: number; y: number }) => holidayDates[cellKey(c)] || null;
  const hasTeam   = (c: { d: number; m: number; y: number }) => teamDates.has(cellKey(c));

  // Renders a single date card (used in both quarter-grouped and flat views)
  const renderDateCard = (dateKey: string) => {
    const dateObj = new Date(dateKey);
    const evs = eventsByDate[dateKey] || [];
    const isTodayDate = dateKey === fmtKey(today);
    const dayHoliday = holidayDates[dateKey] || null;
    const hCol = dayHoliday ? HOLIDAY_COLORS[dayHoliday.type] : null;
    return (
      <div key={dateKey}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 56,
            padding: '6px 10px', borderRadius: 8,
            background: isTodayDate ? '#00ABAF' : (hCol ? `${hCol}33` : 'rgba(255,255,255,0.04)'),
            border: isTodayDate ? '0' : (hCol ? `1px solid ${hCol}` : '1px solid rgba(255,255,255,0.06)'),
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: isTodayDate ? '#fff' : 'var(--text)', lineHeight: 1 }}>{dateObj.getDate()}</div>
            <div style={{ fontSize: 10, color: isTodayDate ? 'rgba(255,255,255,0.85)' : 'color-mix(in srgb, var(--text) 55%, transparent)', marginTop: 2 }}>{MONTHS_AR[dateObj.getMonth()].slice(0,3)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{relativeDay(dateObj, today)}</div>
            {dayHoliday && hCol && (
              <div style={{ fontSize: 11, color: hCol, fontWeight: 700, marginTop: 2 }}>🎉 {dayHoliday.name}</div>
            )}
            <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--text) 55%, transparent)', marginTop: 2 }}>
              {evs.length === 0 ? (dayHoliday ? 'إجازة رسمية' : 'لا فعاليات') : `${evs.length} فعالية`}
            </div>
          </div>
        </div>
        {evs.length === 0 && dayHoliday && hCol ? (
          <div style={{ marginRight: 68, padding: '10px 14px', background: `${hCol}0d`, border: `1px solid ${hCol}33`, borderRadius: 8, color: hCol, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏖️</span>
            <span>إجازة رسمية — لا دوام</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 68 }}>
            {evs.map((p: any) => {
              const meta = p?.program_type ? KIND_META[p.program_type] : null;
              return (
                <div key={p.id} onClick={() => router.push(`/programs/${p.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRight: `3px solid ${meta?.color || 'color-mix(in srgb, var(--text) 55%, transparent)'}`,
                    borderRadius: 8, cursor: 'pointer',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{p.title_ar || p.title || '(بدون عنوان)'}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      {p.code && <span style={{ fontSize: 10, color: 'color-mix(in srgb, var(--text) 55%, transparent)' }}>#{p.code}</span>}
                      {meta && <span style={{ fontSize: 10, color: meta.color, fontWeight: 600 }}>{meta.ar}</span>}
                    </div>
                  </div>
                  <div style={{ color: 'color-mix(in srgb, var(--text) 55%, transparent)', fontSize: 14 }}>›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, color: 'var(--text)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📅 التقويم</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['week','month','quarter'] as const).map(s => (
            <button key={s} onClick={() => setScope(s)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: scope === s ? '#00ABAF' : 'rgba(255,255,255,0.04)',
                color: scope === s ? '#fff' : 'color-mix(in srgb, var(--text) 70%, transparent)',
                border: '1px solid ' + (scope === s ? '#00ABAF' : 'rgba(255,255,255,0.08)'),
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
              {s === 'week' ? 'هذا الأسبوع' : s === 'month' ? 'هذا الشهر' : 'الربع'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                style={{ background: 'transparent', border: 0, color: 'color-mix(in srgb, var(--text) 70%, transparent)', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{MONTHS_AR[viewMonth]} {viewYear}</div>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                style={{ background: 'transparent', border: 0, color: 'color-mix(in srgb, var(--text) 70%, transparent)', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {DAYS_AR.map(d => (
                <div key={d} style={{ fontSize: 10, color: 'color-mix(in srgb, var(--text) 55%, transparent)', textAlign: 'center', padding: 4 }}>{d.slice(0,3)}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {miniCells.map((c, i) => {
                const t = isToday(c); const s = isSelected(c); const e = hasEvent(c);
                const h = getHoliday(c); const tm = hasTeam(c);
                const hColor = h ? HOLIDAY_COLORS[h.type] : null;
                return (
                  <button key={i} onClick={() => setSelectedDate(cellKey(c))}
                    title={h ? `🎉 ${h.name} — إجازة رسمية` : ''}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8,
                      border: t && !s ? '1px solid #00ABAF' : (hColor && !s ? `1px solid ${hColor}` : '1px solid transparent'),
                      background: s ? '#00ABAF' : (hColor ? `${hColor}22` : (t ? 'rgba(0,171,175,0.08)' : 'transparent')),
                      color: s ? '#fff' : (hColor && !s ? hColor : (c.muted ? 'color-mix(in srgb, var(--text) 18%, transparent)' : 'var(--text)')),
                      fontSize: 12, fontWeight: (t || s || h) ? 700 : 400,
                      cursor: 'pointer', position: 'relative', padding: 0,
                    }}>
                    {c.d}
                    {e && !s && <div style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: '#00ABAF' }} />}
                    {tm && !s && <div style={{ position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderRadius: '50%', background: TEAM_DOT_COLOR }} />}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 9, color: 'color-mix(in srgb, var(--text) 55%, transparent)', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {visibleHolidayTypes.length > 0 ? (
                visibleHolidayTypes.map(type => (
                  <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: `${HOLIDAY_COLORS[type]}22`, border: `1px solid ${HOLIDAY_COLORS[type]}` }} />
                    إجازة {HOLIDAY_LABELS[type]}
                  </span>
                ))
              ) : null}
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ABAF' }} />
                فعالية
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: TEAM_DOT_COLOR }} />
                تواجد فريق
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <KpiSm label="فعاليات الشهر" v={monthEventsCount} color="#00ABAF" />
            <KpiSm label="برامج نشطة"    v={(programs || []).length} color="#7C32C9" />
          </div>

          <button onClick={() => { setSelectedDate(fmtKey(today)); setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
            style={{ padding: '10px 14px', background: 'rgba(0,171,175,0.1)', border: '1px solid rgba(0,171,175,0.3)', borderRadius: 10, color: '#00ABAF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ↩ اليوم
          </button>

          <TeamPanel />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {scope !== 'quarter' && filteredDates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'color-mix(in srgb, var(--text) 55%, transparent)', fontSize: 13 }}>لا فعاليات أو إجازات في هذه الفترة</div>
          ) : scope === 'quarter' ? (
            datesByMonth.map(({ monthKey, dates }) => {
              const [year, month] = monthKey.split('-').map(Number);
              let eventCount = 0; let holidayCount = 0;
              for (const d of dates) {
                eventCount += (eventsByDate[d]?.length || 0);
                if (holidayDates[d]) holidayCount++;
              }
              const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={monthKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isCurrentMonth ? 'rgba(0,171,175,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCurrentMonth ? 'rgba(0,171,175,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isCurrentMonth ? '#00ABAF' : 'var(--text)' }}>
                      {MONTHS_AR[month]} {year}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                      <span style={{ color: '#00ABAF', fontWeight: 600 }}>{eventCount} فعالية</span>
                      {holidayCount > 0 && <span style={{ color: '#F59E0B', fontWeight: 600 }}>· {holidayCount} إجازة</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 8 }}>
                    {dates.length === 0 ? (
                      <div style={{ padding: '24px 14px', textAlign: 'center', color: 'color-mix(in srgb, var(--text) 18%, transparent)', fontSize: 12, fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 8 }}>
                        لا فعاليات ولا إجازات في هذا الشهر
                      </div>
                    ) : (
                      dates.map(d => renderDateCard(d))
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            filteredDates.map(d => renderDateCard(d))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiSm({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--text) 70%, transparent)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
