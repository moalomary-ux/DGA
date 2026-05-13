'use client';

import { useState, type ReactNode } from 'react';
import { Pill } from '@/components/qtech/Pill';
import {
  Activity, MessageSquare, GitCommitVertical, FileText, Users, Inbox,
  Pin, Send, Paperclip, AlertCircle, CheckCircle2, Clock, ChevronRight,
  Building, Award, AlertTriangle,
} from 'lucide-react';

type Tab = 'overview' | 'stages' | 'nominations' | 'trainees' | 'discussion' | 'files' | 'activity';

interface Props {
  programId: number;
  currentUserId: string;
  currentUserName: string;
  program: {
    id: number; code: string; name_ar: string; description: string | null;
    status: string; capacity: number | null; enrolledCount: number;
  };
  stages: Array<{
    id: number; stage_code: string; stage_label: string;
    status: string; order_index: number;
    started_at: Date | null; finished_at: Date | null; notes: string | null;
  }>;
  comments: Array<{
    id: number; author_id: string; author_name: string | null;
    body: string; comment_type: string; is_pinned: boolean; is_resolved: boolean;
    created_at: string;
  }>;
  activity: Array<{
    id: number; actor_name: string | null;
    action: string; description: string | null;
    metadata: Record<string, unknown>; created_at: string;
  }>;
  nominations: Array<{
    id: number; status: string; match_score: number | null;
    nominee_name: string; nominee_email: string;
    entity_name: string | null; nominee_position: string | null;
  }>;
  entityBreakdown: Array<{
    entity_name: string; nominees_count: number;
    accepted: number; rejected: number; waiting: number;
  }>;
  trainees: Array<{
    id: number; full_name: string; email: string;
    status: string; gender: string | null;
    organization_name: string | null;
  }>;
  files: Array<{
    id: number; file_name: string; file_size: number | null;
    file_type: string | null; description: string | null;
    uploader_name: string | null; uploaded_at: string;
  }>;
  partners: Array<{
    partner_id: number; partner_name: string; role: string | null;
    partnership_type: string | null; scope: string | null;
  }>;
}

const TABS: { value: Tab; label: string; icon: typeof Activity; badge?: (p: Props) => number | null }[] = [
  { value: 'overview',    label: 'نظرة عامة',  icon: FileText },
  { value: 'stages',      label: 'المراحل',     icon: GitCommitVertical, badge: (p) => p.stages.filter((s) => s.status === 'active').length },
  { value: 'nominations', label: 'الترشيحات',  icon: Inbox,    badge: (p) => p.nominations.filter((n) => n.status === 'waiting').length },
  { value: 'trainees',    label: 'المتدربون',  icon: Users,    badge: (p) => p.trainees.length },
  { value: 'discussion',  label: 'النقاش',      icon: MessageSquare, badge: (p) => p.comments.filter((c) => !c.is_resolved).length },
  { value: 'files',       label: 'الملفات',     icon: Paperclip, badge: (p) => p.files.length },
  { value: 'activity',    label: 'سجل النشاط', icon: Activity },
];

export function ProgramTabs(props: Props) {
  const [active, setActive] = useState<Tab>('overview');

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--line)',
        marginBottom: 18, overflowX: 'auto', gap: 0,
      }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.value;
          const count = t.badge ? t.badge(props) : null;
          return (
            <button key={t.value} onClick={() => setActive(t.value)}
              style={{
                padding: '12px 18px', fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--primary)' : 'var(--text-3)',
                border: 0, background: 'transparent', cursor: 'pointer',
                position: 'relative', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
              }}>
              <Icon size={14} />
              {t.label}
              {count !== null && count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 7px',
                  borderRadius: 99,
                  background: isActive ? 'var(--primary)' : 'var(--bg-2)',
                  color: isActive ? '#fff' : 'var(--text-2)',
                  fontFamily: 'var(--font-mono)',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active === 'overview'    && <OverviewTab {...props} />}
      {active === 'stages'      && <StagesTab    {...props} />}
      {active === 'nominations' && <NominationsTab {...props} />}
      {active === 'trainees'    && <TraineesTab  {...props} />}
      {active === 'discussion'  && <DiscussionTab {...props} />}
      {active === 'files'       && <FilesTab     {...props} />}
      {active === 'activity'    && <ActivityTab  {...props} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   OVERVIEW
   ════════════════════════════════════════════════════════════════════════ */
function OverviewTab(p: Props) {
  const { program, stages, comments, partners, nominations } = p;
  const activeStage = stages.find((s) => s.status === 'active');
  const completedStages = stages.filter((s) => s.status === 'done').length;
  const totalStages = stages.length;
  const stageProgress = Math.round((completedStages / Math.max(1, totalStages)) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* الوصف */}
        {program.description && (
          <Card title="الوصف">
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-2)' }}>{program.description}</p>
          </Card>
        )}

        {/* تقدّم المراحل */}
        <Card title="رحلة البرنامج" right={`${completedStages}/${totalStages} مرحلة مكتملة`}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {stages.map((s) => (
              <div key={s.id} title={s.stage_label} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s.status === 'done' ? 'var(--success)'
                  : s.status === 'active' ? 'var(--primary)'
                  : 'var(--bg-2)',
              }} />
            ))}
          </div>
          {activeStage && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: 10, background: 'var(--primary-bg)',
              borderRadius: 8, color: 'var(--primary)',
            }}>
              <Clock size={14} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>المرحلة الحالية: {activeStage.stage_label}</span>
            </div>
          )}
        </Card>

        {/* أحدث النقاش */}
        <Card title="آخر النقاش" right={`${comments.length} تعليق`}>
          {comments.length === 0 ? (
            <Empty text="لا يوجد نقاش بعد. ابدأ المحادثة من تاب النقاش." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.slice(0, 3).map((c) => <CommentMini key={c.id} c={c} />)}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ملخص الترشيحات */}
        <Card title="ملخص الترشيحات">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="إجمالي" value={nominations.length} />
            <Stat label="مقبول" value={nominations.filter((n) => n.status === 'accepted').length} color="var(--success)" />
            <Stat label="معلّق" value={nominations.filter((n) => n.status === 'waiting').length} color="var(--warning)" />
            <Stat label="مرفوض" value={nominations.filter((n) => n.status === 'rejected').length} color="var(--danger)" />
          </div>
        </Card>

        {/* الشركاء */}
        <Card title="الشركاء" right={`${partners.length}`}>
          {partners.length === 0 ? (
            <Empty text="لا يوجد شركاء مرتبطون" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partners.map((p) => (
                <div key={p.partner_id} style={{
                  padding: 10, background: 'var(--bg-2)', borderRadius: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.partner_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {p.scope === 'international' ? '🌍 دولي · ' : '🇸🇦 محلي · '}{p.role || 'شريك'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* الصحة */}
        <Card title="مؤشر الصحة">
          <HealthIndicator program={program} stageProgress={stageProgress} />
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   STAGES (Kanban-like timeline)
   ════════════════════════════════════════════════════════════════════════ */
function StagesTab(p: Props) {
  const { stages, programId, currentUserId } = p;
  const [updating, setUpdating] = useState<number | null>(null);

  const moveStage = async (stageId: number, newStatus: 'done' | 'active' | 'pending' | 'blocked') => {
    setUpdating(stageId);
    try {
      await fetch(`/api/programs/${programId}/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: currentUserId }),
      });
      window.location.reload();
    } catch {
      setUpdating(null);
    }
  };

  return (
    <Card title="مراحل البرنامج" right="انقل بين المراحل بالضغط على الأزرار">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((s, idx) => {
          const isLast = idx === stages.length - 1;
          const tone = s.status === 'done' ? 'success' : s.status === 'active' ? 'info' : s.status === 'blocked' ? 'danger' : 'muted';
          const StatusIcon = s.status === 'done' ? CheckCircle2 : s.status === 'active' ? Clock : s.status === 'blocked' ? AlertTriangle : Clock;
          return (
            <div key={s.id} style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: 16, background: 'var(--surface)', border: '1px solid var(--line)',
                borderInlineStart: `3px solid ${
                  s.status === 'done' ? 'var(--success)' :
                  s.status === 'active' ? 'var(--primary)' :
                  s.status === 'blocked' ? 'var(--danger)' : 'var(--line-2)'
                }`,
                borderRadius: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: s.status === 'done' ? 'var(--success-bg)' : s.status === 'active' ? 'var(--primary-bg)' : 'var(--bg-2)',
                  color: s.status === 'done' ? 'var(--success)' : s.status === 'active' ? 'var(--primary)' : 'var(--text-3)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                }}>{s.order_index}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.stage_label}</h4>
                    <Pill tone={tone}>
                      <StatusIcon size={10} />
                      {s.status === 'done' ? 'مكتمل' : s.status === 'active' ? 'جارٍ' : s.status === 'blocked' ? 'متوقف' : 'لم يبدأ'}
                    </Pill>
                  </div>
                  {s.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{s.notes}</p>}
                  {s.started_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                      بدأت: {new Date(s.started_at).toLocaleDateString('ar-SA')}
                      {s.finished_at && ` · انتهت: ${new Date(s.finished_at).toLocaleDateString('ar-SA')}`}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {s.status !== 'done' && (
                    <SmallBtn disabled={updating === s.id} onClick={() => moveStage(s.id, 'done')}>إنهاء</SmallBtn>
                  )}
                  {s.status === 'pending' && (
                    <SmallBtn disabled={updating === s.id} onClick={() => moveStage(s.id, 'active')} primary>بدء</SmallBtn>
                  )}
                  {s.status === 'active' && (
                    <SmallBtn disabled={updating === s.id} onClick={() => moveStage(s.id, 'blocked')}>إيقاف</SmallBtn>
                  )}
                </div>
              </div>
              {!isLast && (
                <div style={{
                  width: 2, height: 14, marginInlineStart: 31, background: 'var(--line-2)',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   NOMINATIONS
   ════════════════════════════════════════════════════════════════════════ */
function NominationsTab(p: Props) {
  const { nominations, entityBreakdown } = p;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {entityBreakdown.length > 0 && (
        <Card title="التجاوب حسب الجهة" right={`${entityBreakdown.length} جهة`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {entityBreakdown.map((e) => (
              <div key={e.entity_name} style={{
                padding: 14, background: 'var(--bg-2)', borderRadius: 10,
                border: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <Building size={16} style={{ color: 'var(--primary)', marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.entity_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {e.nominees_count} مرشّح
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                  <span style={{ color: 'var(--success)' }}>✓ {e.accepted} قُبل</span>
                  <span style={{ color: 'var(--warning)' }}>⌛ {e.waiting} معلّق</span>
                  <span style={{ color: 'var(--danger)' }}>✗ {e.rejected} مرفوض</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="قائمة الترشيحات" right={`${nominations.length} ترشيح`}>
        {nominations.length === 0 ? (
          <Empty text="لا توجد ترشيحات بعد" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>المرشح</th>
                <th style={thStyle}>الجهة</th>
                <th style={thStyle}>التطابق</th>
                <th style={thStyle}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {nominations.map((n) => {
                const score = n.match_score;
                const scoreColor = !score ? 'var(--text-3)' :
                  score >= 80 ? 'var(--success)' :
                  score >= 60 ? 'var(--warning)' : 'var(--danger)';
                const tone = n.status === 'accepted' ? 'success' :
                  n.status === 'rejected' ? 'danger' :
                  n.status === 'waiting' ? 'warning' : 'muted';
                const arStatus = n.status === 'accepted' ? 'مقبول' :
                  n.status === 'rejected' ? 'مرفوض' :
                  n.status === 'waiting' ? 'معلّق' : n.status;
                return (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{n.nominee_name}</div>
                      {n.nominee_position && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{n.nominee_position}</div>}
                    </td>
                    <td style={tdStyle}>{n.entity_name || '—'}</td>
                    <td style={tdStyle}>
                      {score !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 50, height: 4, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: '100%', background: scoreColor }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: scoreColor, fontWeight: 600 }}>
                            {score}%
                          </span>
                        </div>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={tdStyle}><Pill tone={tone}>{arStatus}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   TRAINEES
   ════════════════════════════════════════════════════════════════════════ */
function TraineesTab(p: Props) {
  const { trainees } = p;
  if (trainees.length === 0) {
    return <Card title="المتدربون"><Empty text="لا يوجد متدربون مسجّلون بعد" /></Card>;
  }
  return (
    <Card title="المتدربون" right={`${trainees.length} متدرب`}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>الاسم</th>
            <th style={thStyle}>الإيميل</th>
            <th style={thStyle}>الجهة</th>
            <th style={thStyle}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {trainees.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
              <td style={tdStyle}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{t.full_name}</span>
                {t.gender && <span style={{ marginInlineStart: 6, fontSize: 11, color: 'var(--text-3)' }}>
                  {t.gender === 'female' ? '♀' : '♂'}
                </span>}
              </td>
              <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.email}</td>
              <td style={tdStyle}>{t.organization_name || '—'}</td>
              <td style={tdStyle}><Pill tone={t.status === 'active' ? 'info' : 'success'}>{t.status === 'active' ? 'نشط' : 'مكتمل'}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   DISCUSSION
   ════════════════════════════════════════════════════════════════════════ */
function DiscussionTab(p: Props) {
  const { comments, programId, currentUserId, currentUserName } = p;
  const [body, setBody] = useState('');
  const [type, setType] = useState<'note' | 'update' | 'alert' | 'blocker' | 'decision' | 'question'>('note');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/programs/${programId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, comment_type: type, author_id: currentUserId, author_name: currentUserName }),
      });
      window.location.reload();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* New comment box */}
      <Card title="إضافة تعليق / تحديث">
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {([
            { code: 'note',     ar: '📝 ملاحظة',  color: 'var(--text-3)' },
            { code: 'update',   ar: '🔄 تحديث',   color: 'var(--primary)' },
            { code: 'alert',    ar: '⚠️ تنبيه',   color: 'var(--warning)' },
            { code: 'blocker',  ar: '🚫 معوّق',    color: 'var(--danger)' },
            { code: 'decision', ar: '✓ قرار',      color: 'var(--success)' },
            { code: 'question', ar: '❓ سؤال',     color: 'var(--accent-2)' },
          ] as const).map((opt) => (
            <button key={opt.code} onClick={() => setType(opt.code)}
              style={{
                padding: '5px 12px', borderRadius: 99,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: type === opt.code ? 'var(--primary-bg-2)' : 'var(--bg-2)',
                color: type === opt.code ? 'var(--primary)' : 'var(--text-2)',
                border: `1px solid ${type === opt.code ? 'var(--primary)' : 'var(--line)'}`,
              }}>{opt.ar}</button>
          ))}
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب تحديثاً، طرح فكرة، اطرح سؤالاً..."
          style={{
            width: '100%', minHeight: 90, padding: 12,
            background: 'var(--bg-2)', border: '1px solid var(--line)',
            borderRadius: 8, fontSize: 13, color: 'var(--text)',
            resize: 'vertical', fontFamily: 'inherit',
          }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={submit} disabled={!body.trim() || submitting}
            style={{
              padding: '9px 18px', background: 'var(--grad-2)',
              color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: 0, cursor: 'pointer', opacity: !body.trim() || submitting ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            <Send size={14} />
            {submitting ? 'جارٍ الإرسال...' : 'نشر'}
          </button>
        </div>
      </Card>

      {/* Comments list */}
      <Card title="النقاش" right={`${comments.length} تعليق`}>
        {comments.length === 0 ? (
          <Empty text="ابدأ النقاش — أول تعليق يفتح المحادثة" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map((c) => <CommentFull key={c.id} c={c} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FILES
   ════════════════════════════════════════════════════════════════════════ */
function FilesTab(p: Props) {
  const { files } = p;
  return (
    <Card title="ملفات البرنامج" right={`${files.length} ملف`}>
      {files.length === 0 ? (
        <Empty text="لم يُرفع أي ملف بعد. ميزة الرفع قادمة قريباً." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 12, background: 'var(--bg-2)', borderRadius: 8,
              border: '1px solid var(--line)',
            }}>
              <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.file_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {f.uploader_name && `${f.uploader_name} · `}
                  {new Date(f.uploaded_at).toLocaleDateString('ar-SA')}
                  {f.file_size && ` · ${(f.file_size / 1024).toFixed(0)} KB`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ACTIVITY
   ════════════════════════════════════════════════════════════════════════ */
function ActivityTab(p: Props) {
  const { activity } = p;
  return (
    <Card title="سجل النشاط" right={`${activity.length} حدث`}>
      {activity.length === 0 ? (
        <Empty text="لا يوجد سجل بعد. سيتم تسجيل التغييرات تلقائياً." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.map((a) => (
            <div key={a.id} style={{
              display: 'flex', gap: 12, padding: 12,
              background: 'var(--bg-2)', borderRadius: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--primary-bg)', color: 'var(--primary)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Activity size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>
                  <b>{a.actor_name || 'النظام'}</b> {a.description || a.action}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {new Date(a.created_at).toLocaleString('ar-SA')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Reusable bits
   ════════════════════════════════════════════════════════════════════════ */
function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
        {right && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{right}</div>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      {text}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)', fontFamily: 'var(--font-display)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SmallBtn({ children, onClick, disabled, primary }: { children: ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 12px', fontSize: 11, fontWeight: 600,
      borderRadius: 6, cursor: disabled ? 'wait' : 'pointer',
      background: primary ? 'var(--primary)' : 'var(--bg-2)',
      color: primary ? '#fff' : 'var(--text-2)',
      border: `1px solid ${primary ? 'var(--primary)' : 'var(--line)'}`,
      opacity: disabled ? 0.6 : 1,
    }}>{children}</button>
  );
}

const COMMENT_TYPE_META: Record<string, { ar: string; emoji: string; bg: string; fg: string }> = {
  note:     { ar: 'ملاحظة',  emoji: '📝', bg: 'var(--bg-2)',          fg: 'var(--text-3)'  },
  update:   { ar: 'تحديث',   emoji: '🔄', bg: 'var(--primary-bg)',    fg: 'var(--primary)' },
  alert:    { ar: 'تنبيه',   emoji: '⚠️', bg: 'var(--warning-bg)',    fg: 'var(--warning)' },
  blocker:  { ar: 'معوّق',    emoji: '🚫', bg: 'var(--danger-bg)',     fg: 'var(--danger)'  },
  decision: { ar: 'قرار',     emoji: '✓',  bg: 'var(--success-bg)',    fg: 'var(--success)' },
  question: { ar: 'سؤال',    emoji: '❓', bg: 'var(--accent-bg)',     fg: 'var(--accent-2)'},
};

function CommentMini({ c }: { c: Props['comments'][number] }) {
  const m = COMMENT_TYPE_META[c.comment_type] || COMMENT_TYPE_META.note;
  return (
    <div style={{
      padding: 10, background: 'var(--bg-2)', borderRadius: 8,
      borderInlineStart: `2px solid ${m.fg}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{m.emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.author_name || 'مستخدم'}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.body}</p>
    </div>
  );
}

function CommentFull({ c }: { c: Props['comments'][number] }) {
  const m = COMMENT_TYPE_META[c.comment_type] || COMMENT_TYPE_META.note;
  return (
    <div style={{
      padding: 14, background: 'var(--bg-2)', borderRadius: 10,
      borderInlineStart: `3px solid ${m.fg}`,
      opacity: c.is_resolved ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--grad-1)', color: '#fff',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          fontWeight: 700, fontSize: 12,
        }}>
          {(c.author_name || 'م').charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.author_name || 'مستخدم'}</span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 99,
              background: m.bg, color: m.fg, fontWeight: 600,
            }}>{m.emoji} {m.ar}</span>
            {c.is_pinned && <Pin size={11} style={{ color: 'var(--warning)' }} />}
            {c.is_resolved && <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 99,
              background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 600,
            }}>✓ مغلق</span>}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {new Date(c.created_at).toLocaleString('ar-SA')}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, paddingInlineStart: 42, whiteSpace: 'pre-wrap' }}>{c.body}</p>
    </div>
  );
}

function HealthIndicator({ program, stageProgress }: { program: Props['program']; stageProgress: number }) {
  const fill = program.capacity ? Math.round((program.enrolledCount / program.capacity) * 100) : 0;
  const health = stageProgress >= 70 || fill >= 80 ? 'good' : stageProgress >= 30 ? 'warning' : 'critical';
  const meta = {
    good:     { color: 'var(--success)', text: 'في المسار', icon: CheckCircle2 },
    warning:  { color: 'var(--warning)', text: 'يحتاج متابعة', icon: AlertCircle },
    critical: { color: 'var(--danger)',  text: 'متأخّر',         icon: AlertTriangle },
  }[health];
  const Icon = meta.icon;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={20} style={{ color: meta.color }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: meta.color }}>{meta.text}</span>
      </div>
      <Stat label="تقدّم المراحل" value={stageProgress} color={meta.color} />
      <div style={{ marginTop: 8 }}><Stat label="الإشغال" value={fill} color={meta.color} /></div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'start', padding: '10px 12px',
  fontFamily: 'var(--font-display)', fontSize: 10,
  letterSpacing: '0.1em', color: 'var(--text-3)',
  textTransform: 'uppercase', borderBottom: '1px solid var(--line)',
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '12px', color: 'var(--text-2)' };
