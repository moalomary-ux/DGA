'use client';
import { useEffect, useState } from 'react';

interface UserOpt { id: string; email: string; name_ar: string; }
interface Avail {
  id: number;
  user_id: string;
  name_ar: string;
  email: string;
  status: 'available' | 'remote' | 'leave' | 'external';
  start_date: string;
  end_date: string;
  note: string | null;
}

const STATUS_META: Record<string, { ar: string; color: string; icon: string }> = {
  remote:   { ar: 'عن بُعد', color: '#F59E0B', icon: '🟠' },
  leave:    { ar: 'إجازة',   color: '#EF4444', icon: '🔴' },
  external: { ar: 'انتداب',  color: '#3F7DD9', icon: '🔵' },
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtRange(start: string, end: string) {
  if (start === end) return new Date(start).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${new Date(start).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })} → ${new Date(end).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function isPast(end: string) { return new Date(end + 'T23:59:59') < new Date(); }

export default function AdminTeamPage() {
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [records, setRecords] = useState<Avail[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [fUser, setFUser] = useState('');
  const [fStatus, setFStatus] = useState<'remote' | 'leave' | 'external'>('remote');
  const [fStart, setFStart] = useState(todayISO());
  const [fEnd, setFEnd] = useState(todayISO());
  const [fNote, setFNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch('/api/team/availability?mode=admin');
    if (r.status === 403) { setDenied(true); setLoading(false); return; }
    const d = await r.json();
    if (d.ok) { setUsers(d.users || []); setRecords(d.records || []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!fUser) { alert('اختر الشخص'); return; }
    if (!fStart || !fEnd) { alert('اختر التواريخ'); return; }
    if (fEnd < fStart)    { alert('تاريخ النهاية قبل البداية'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/team/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: fUser, status: fStatus, start_date: fStart, end_date: fEnd, note: fNote || null }),
      });
      const d = await r.json();
      if (d.ok) { setFUser(''); setFNote(''); setFStart(todayISO()); setFEnd(todayISO()); await load(); }
      else { alert('فشل: ' + (d.error || 'خطأ')); }
    } finally { setSaving(false); }
  }

  async function delRec(id: number) {
    if (!confirm('حذف هذا السجل؟')) return;
    const r = await fetch(`/api/team/availability?id=${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) await load();
    else alert('فشل: ' + (d.error || 'خطأ'));
  }

  if (denied) {
    return (
      <div className="page fade-in" style={{ padding: 24 }} dir="rtl">
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 24, textAlign: 'center', color: '#EF4444' }}>
          هذه الصفحة للمدراء فقط
        </div>
      </div>
    );
  }

  const upcoming = records.filter(r => !isPast(r.end_date));
  const past = records.filter(r => isPast(r.end_date));

  return (
    <div className="page fade-in" style={{ padding: 24 }} dir="rtl">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#e2e8f0' }}>إدارة تواجد الفريق</h1>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          سجّل إجازات الفريق، أيام العمل عن بُعد، والانتدابات الخارجية
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Form */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e2e8f0' }}>إضافة سجل جديد</h3>

          <Field label="الشخص">
            <select value={fUser} onChange={e => setFUser(e.target.value)} style={inputStyle}>
              <option value="">— اختر —</option>
              {users.map(u => (<option key={u.id} value={u.id}>{u.name_ar} ({u.email})</option>))}
            </select>
          </Field>

          <Field label="الحالة">
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(k => {
                const m = STATUS_META[k as string];
                const active = fStatus === k;
                return (
                  <button key={k as string} type="button" onClick={() => setFStatus(k as any)}
                    style={{
                      flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 600,
                      background: active ? m.color : 'rgba(255,255,255,0.04)',
                      color: active ? '#fff' : '#94a3b8',
                      border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {m.icon} {m.ar}
                  </button>
                );
              })}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="من تاريخ">
              <input type="date" value={fStart} onChange={e => { setFStart(e.target.value); if (fEnd < e.target.value) setFEnd(e.target.value); }} style={inputStyle} />
            </Field>
            <Field label="إلى تاريخ">
              <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <Field label="ملاحظة (اختياري)">
            <input type="text" value={fNote} onChange={e => setFNote(e.target.value)} placeholder="مثال: مؤتمر القمة الخليجية" style={inputStyle} />
          </Field>

          <button onClick={submit} disabled={saving || !fUser}
            style={{
              width: '100%', padding: '12px', marginTop: 6,
              background: !fUser ? '#1f2937' : '#00ABAF',
              color: !fUser ? '#475569' : '#fff',
              border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: !fUser ? 'not-allowed' : 'pointer',
            }}>
            {saving ? 'جاري الحفظ...' : '+ إضافة سجل'}
          </button>
        </div>

        {/* List */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#e2e8f0' }}>قائمة فعّالة وقادمة ({upcoming.length})</h3>
            {loading ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>جاري التحميل...</div>
            ) : upcoming.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 40, fontSize: 13 }}>لا سجلات فعّالة</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(r => {
                  const m = STATUS_META[r.status];
                  if (!m) return null;
                  return (
                    <div key={r.id} style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                      gap: 12, alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRight: `3px solid ${m.color}`,
                      borderRadius: 10,
                    }}>
                      <div style={{ fontSize: 18 }}>{m.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{r.name_ar}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: m.color, fontWeight: 600 }}>{m.ar}</span>
                          <span>·</span>
                          <span>{fmtRange(r.start_date, r.end_date)}</span>
                          {r.note && <><span>·</span><span style={{ fontStyle: 'italic' }}>{r.note}</span></>}
                        </div>
                      </div>
                      <button onClick={() => delRec(r.id)} title="حذف"
                        style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                        حذف
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>منتهية ({past.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {past.slice(0, 10).map(r => {
                  const m = STATUS_META[r.status];
                  if (!m) return null;
                  return (
                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '8px 12px', opacity: 0.65 }}>
                      <div style={{ fontSize: 14 }}>{m.icon}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {r.name_ar} · <span style={{ color: m.color }}>{m.ar}</span> · {fmtRange(r.start_date, r.end_date)}
                      </div>
                      <button onClick={() => delRec(r.id)} title="حذف" style={{ background: 'transparent', border: 0, color: '#475569', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13,
  fontFamily: 'inherit', boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
