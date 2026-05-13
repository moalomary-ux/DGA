'use client';
import { useState, useEffect, Fragment, useMemo } from 'react';

const DAYS_SHORT_AR = ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'];
const STATUS_META: Record<string, { ar: string; color: string; icon: string }> = {
  available: { ar: 'متاح',   color: '#10B981', icon: '✓' },
  remote:    { ar: 'عن بُعد', color: '#F59E0B', icon: '🏠' },
  leave:     { ar: 'إجازة',  color: '#EF4444', icon: '🌴' },
  external:  { ar: 'انتداب', color: '#3F7DD9', icon: '✈️' },
};

function fmtKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function TeamPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<'today' | 'week'>('today');

  useEffect(() => {
    fetch('/api/team/availability?mode=admin')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (Array.isArray(d.users))   setUsers(d.users);
          if (Array.isArray(d.records)) setRecords(d.records);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const todayKey = fmtKey(new Date());

  const workWeekDates = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0,0,0,0);
    const arr: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const getStatusOnDate = (userId: string, dateKey: string): string => {
    for (const r of records) {
      if (!r || r.user_id !== userId) continue;
      const start = String(r.start_date || '').slice(0, 10);
      const end = String(r.end_date || '').slice(0, 10);
      if (start && end && dateKey >= start && dateKey <= end) {
        return r.status || 'available';
      }
    }
    return 'available';
  };

  if (!loaded) return null;
  if (users.length === 0) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
          لا أعضاء فريق · <a href="/admin/team" style={{ color: '#00ABAF', textDecoration: 'none' }}>إضافة ›</a>
        </div>
      </div>
    );
  }

  const todayStats: Record<string, number> = { available: 0, remote: 0, leave: 0, external: 0 };
  for (const u of users) {
    const s = getStatusOnDate(u.id, todayKey);
    todayStats[s] = (todayStats[s] || 0) + 1;
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
        {(['today','week'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '6px 8px',
            background: tab === t ? '#00ABAF' : 'transparent',
            color: tab === t ? '#fff' : '#94a3b8',
            border: 0, borderRadius: 6,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {t === 'today' ? '👥 اليوم' : '📅 الأسبوع'}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 8px',
                background: `${meta.color}11`,
                border: `1px solid ${meta.color}22`,
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>{meta.ar}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, lineHeight: 1 }}>{todayStats[key] || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
            {users.map((u: any) => {
              const status = getStatusOnDate(u.id, todayKey);
              const meta = STATUS_META[status];
              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 8px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name_ar || u.email}</span>
                  <span style={{ fontSize: 11, color: meta.color }}>{meta.icon}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 3 }}>
          <div></div>
          {workWeekDates.map((d, i) => {
            const isTodayCell = fmtKey(d) === todayKey;
            return (
              <div key={`h-${i}`} style={{
                textAlign: 'center', padding: '3px 1px', borderRadius: 4,
                background: isTodayCell ? 'rgba(0,171,175,0.12)' : 'transparent',
                border: isTodayCell ? '1px solid rgba(0,171,175,0.3)' : '1px solid transparent',
              }}>
                <div style={{ fontSize: 8, color: '#64748b' }}>{DAYS_SHORT_AR[d.getDay()]}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0', marginTop: 1 }}>{d.getDate()}</div>
              </div>
            );
          })}

          {users.map((u: any) => (
            <Fragment key={u.id}>
              <div style={{
                padding: '3px 4px', fontSize: 9, color: '#e2e8f0',
                display: 'flex', alignItems: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={u.name_ar || u.email}>
                {(u.name_ar || u.email || '—').slice(0, 10)}
              </div>
              {workWeekDates.map((d, i) => {
                const status = getStatusOnDate(u.id, fmtKey(d));
                const meta = STATUS_META[status];
                return (
                  <div key={`c-${u.id}-${i}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 3, borderRadius: 4, minHeight: 22,
                    background: `${meta.color}15`,
                    color: meta.color,
                    fontSize: 10, fontWeight: 600,
                  }} title={meta.ar}>
                    {meta.icon}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <a href="/admin/team" style={{ fontSize: 9, color: '#00ABAF', textDecoration: 'none', fontWeight: 600 }}>إدارة ›</a>
      </div>
    </div>
  );
}
