'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ProgramForum from "./ProgramForum";
import ProgramNomineesBanner from "./ProgramNomineesBanner";

// ═══════════════════ Types ═══════════════════
interface ProgramData {
  id: number;
  title_ar: string;
  code: string | null;
  program_type: string | null;
  category: string | null;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  enrolled_count: number | null;
  status: string | null;
  delivery_mode: string | null;
  kind: string | null;
  rating: number | null;
  attendees: number;
  owners?: { user_id: string; name_ar: string; role: string }[];
}
interface TaskState {
  done: boolean;
  closed_by_name?: string;
  closed_at?: string;
  close_note?: string;
}

// ═══════════════════ Constants ═══════════════════
const KIND_META: Record<string, { ar: string; color: string; bg: string }> = {
  international: { ar: 'دولي', color: '#7C32C9', bg: 'rgba(124,50,201,0.12)' },
  local: { ar: 'محلي', color: '#00ABAF', bg: 'rgba(0,171,175,0.12)' },
  workshop: { ar: 'ورشة عمل', color: '#FF8533', bg: 'rgba(255,133,51,0.12)' },
  seminar: { ar: 'ندوة معرفية', color: '#3F7DD9', bg: 'rgba(63,125,217,0.12)' },
  closed: { ar: 'مغلق', color: '#7A82A8', bg: 'rgba(122,130,168,0.12)' },
};
const STATUS_META: Record<string, { ar: string; cls: string }> = {
  ideation: { ar: 'فكرة', cls: 'accent' },
  development: { ar: 'تجهيز', cls: 'warning' },
  review: { ar: 'مراجعة', cls: 'accent' },
  registration: { ar: 'فتح التسجيل', cls: 'info' },
  execution: { ar: 'قيد التنفيذ', cls: 'success' },
  closed: { ar: 'مغلق', cls: 'muted' },
};
const PHASES = [
  { id: 'build', t: 'بناء البرامج والشراكات', dur: '10–15 يوم عمل', color: '#7C32C9' },
  { id: 'run', t: 'التشغيل والتنفيذ', dur: '15–25 يوم عمل', color: '#00ABAF' },
  { id: 'close', t: 'الإغلاق وبناء الأثر', dur: '7–10 أيام عمل', color: '#FF8533' },
];
const STEPS = [
  { id: 1, ph: 'build', t: 'البحث والاستكشاف', icon: 'search',
    tasks: ['رصد الاحتياجات التدريبية والاتجاهات الحديثة', 'متابعة التقارير والمبادرات', 'تسجيل فكرة البرنامج ومبرراته', 'تحديد الأهداف والفئة المستهدفة', 'توثيق الفكرة في سجل الأفكار'] },
  { id: 2, ph: 'build', t: 'اختيار الشريك المناسب', icon: 'handshake',
    tasks: ['تحديد نوع الشريك (خبير / معهد / جهة حكومية)', 'مراجعة السيرة الذاتية أو العرض', 'مقارنة العروض والتكلفة', 'اختيار نوع التعاون', 'الاتفاق على التعاون'] },
  { id: 3, ph: 'build', t: 'التفاوض والاعتماد', icon: 'check2',
    tasks: ['متابعة التفاوض وتحديد التفاصيل', 'رفع عرض الشراكة لمدير الإدارة', 'أخذ موافقة مدير الإدارة', 'توثيق الاتفاق والخطاب الرسمي', 'تثبيت المواعيد والميزانية'] },
  { id: 4, ph: 'run', t: 'تجهيز البرنامج', icon: 'book',
    tasks: ['كتابة وصف البرنامج والأهداف', 'تصميم البروشور والمحتوى', 'إنشاء صفحة التسجيل', 'تجهيز رسائل الدعوة', 'إعداد كل ما يلزم للإطلاق'] },
  { id: 5, ph: 'run', t: 'إرسال الدعوات والاستقبال', icon: 'mail',
    tasks: ['إرسال الدعوات لضباط الاتصال', 'نشر البروشور وروابط التسجيل', 'الرد على الاستفسارات', 'متابعة الإقبال يومياً'] },
  { id: 6, ph: 'run', t: 'الفرز والقبول', icon: 'inbox',
    tasks: ['مراجعة طلبات التسجيل', 'تطبيق معايير القبول (يدوي + AI)', 'اعتماد المقبولين', 'إعداد قائمة الانتظار'], linkTo: '/nominations' },
  { id: 7, ph: 'run', t: 'التأكيد والترتيبات', icon: 'check2',
    tasks: ['إرسال إشعارات القبول (مهلة 3 أيام)', 'طلب تأكيد الحضور', 'متابعة غير المؤكدين', 'استبدال المقاعد من الانتظار'] },
  { id: 8, ph: 'run', t: 'التجهيز النهائي', icon: 'file',
    tasks: ['تأكيد الموقع والجدول الزمني', 'إرسال دليل المشارك والتعليمات', 'تجهيز المواد والموارد', 'عقد لقاء تعريفي'] },
  { id: 9, ph: 'close', t: 'التنفيذ والمتابعة', icon: 'rocket',
    tasks: ['تسجيل الحضور يومياً', 'متابعة سير البرنامج', 'معالجة أي ملاحظات فورية', 'استبيان يومي سريع'] },
  { id: 10, ph: 'close', t: 'التقييم الختامي', icon: 'star',
    tasks: ['إرسال استبيان شامل', 'تحليل النتائج', 'تقرير جودة البرنامج'] },
  { id: 11, ph: 'close', t: 'إصدار الشهادات', icon: 'badge',
    tasks: ['إصدار الشهادات', 'توثيق الحضور والمخرجات', 'أرشفة المواد والتوثيق'] },
  { id: 12, ph: 'close', t: 'تقرير البرنامج', icon: 'chart',
    tasks: ['إعداد التقرير الختامي', 'أبرز النتائج والتوصيات', 'مشاركة التقرير مع الشركاء'] },
  { id: 13, ph: 'close', t: 'مجتمع الخبراء', icon: 'users',
    tasks: ['حصر المتميزين', 'بناء قاعدة خبراء', 'استقطابهم لفرص مستقبلية', 'بناء علاقات مستدامة'] },
];

// Map program status → current step
const STATUS_TO_STEP: Record<string, number> = {
  ideation: 1, development: 2, review: 3, registration: 5, execution: 9, closed: 13,
};

// ═══════════════════ Component ═══════════════════
export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string, 10);

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [closeModal, setCloseModal] = useState<{ sid: number; ti: number; title: string } | null>(null);
  const [closeNote, setCloseNote] = useState('');

  // Fetch program + states
  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/programs/${id}`).then((r) => r.json()),
      fetch(`/api/programs/${id}/journey`).then((r) => r.json()),
    ]).then(([progRes, jrRes]) => {
      if (progRes.ok) {
        setProgram(progRes.program);
        const curStep = STATUS_TO_STEP[progRes.program.status || 'ideation'] || 1;
        setActiveStep(curStep);
      }
      if (jrRes.ok) setTaskStates(jrRes.states || {});
      setLoading(false);
    });
  }, [id]);

  const curStep = program ? STATUS_TO_STEP[program.status || 'ideation'] || 1 : 1;
  const kindMeta = program?.kind ? KIND_META[program.kind] || KIND_META.local : KIND_META.local;
  const statusMeta = program?.status ? STATUS_META[program.status] || STATUS_META.ideation : STATUS_META.ideation;

  // Compute task state (with defaults for past steps)
  const getTaskState = useCallback(
    (sid: number, ti: number): TaskState => {
      const key = `${sid}-${ti}`;
      const persisted = taskStates[key];
      if (persisted) return persisted;
      // Auto-done for past steps
      if (sid < curStep) return { done: true, closed_by_name: 'النظام', closed_at: '—' };
      return { done: false };
    },
    [taskStates, curStep]
  );

  // Toggle task (open close modal if marking done)
  const toggleTask = async (sid: number, ti: number, taskTitle: string) => {
    const cur = getTaskState(sid, ti);
    if (cur.done) {
      // Unmark → just save
      await persistTaskState(sid, ti, { done: false });
    } else {
      // Open modal for note
      setCloseModal({ sid, ti, title: taskTitle });
      setCloseNote('');
    }
  };

  const persistTaskState = async (sid: number, ti: number, state: Partial<TaskState>) => {
    const key = `${sid}-${ti}`;
    setTaskStates((s) => ({ ...s, [key]: { ...s[key], ...state } as TaskState }));
    await fetch(`/api/programs/${id}/journey/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: sid, task_index: ti, ...state }),
    });
  };

  const confirmClose = async () => {
    if (!closeModal) return;
    await persistTaskState(closeModal.sid, closeModal.ti, {
      done: true,
      close_note: closeNote.trim() || undefined,
    });
    // Re-fetch to get server's closed_by_name and closed_at
    const jr = await fetch(`/api/programs/${id}/journey`).then((r) => r.json());
    if (jr.ok) setTaskStates(jr.states || {});
    setCloseModal(null);
  };

  // Phase progress
  const phaseProgress = useMemo(() => {
    return PHASES.map((ph) => {
      const phaseSteps = STEPS.filter((s) => s.ph === ph.id);
      const totalTasks = phaseSteps.reduce((sum, s) => sum + s.tasks.length, 0);
      let doneTasks = 0;
      phaseSteps.forEach((s) => {
        s.tasks.forEach((_, ti) => {
          if (getTaskState(s.id, ti).done) doneTasks++;
        });
      });
      return { ...ph, pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0, doneTasks, totalTasks };
    });
  }, [getTaskState]);

  const overallProgress = useMemo(() => {
    const all = STEPS.flatMap((s) => s.tasks.map((_, ti) => ({ sid: s.id, ti })));
    const done = all.filter(({ sid, ti }) => getTaskState(sid, ti).done).length;
    return { pct: all.length ? Math.round((done / all.length) * 100) : 0, done, total: all.length };
  }, [getTaskState]);

  if (loading) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: 400 }}>
        <div style={{ color: 'var(--text-3)' }}>جارٍ التحميل...</div>
      </div>
    );
  }
  if (!program) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-3)' }}>البرنامج غير موجود</p>
        <Link href="/programs" className="link-btn">عودة للبرامج</Link>
      </div>
    );
  }

  const selectedStep = STEPS.find((s) => s.id === activeStep)!;
  const selPhase = PHASES.find((p) => p.id === selectedStep.ph)!;
  const stepTaskStates = selectedStep.tasks.map((_, ti) => getTaskState(selectedStep.id, ti));
  const stepDone = stepTaskStates.filter((s) => s.done).length;
  const stepPct = Math.round((stepDone / selectedStep.tasks.length) * 100);

  return (
    <div className="fade-in journey-page">
      {/* Back link */}
      <Link href="/programs" className="back-link">
        <Icon n="chevR" size={14} /> عودة للبرامج
      </Link>

      {/* Hero */}
      <div className="journey-hero">
        <div className="jh-bg" />
        <div className="jh-row">
          <div>
            <div className="jh-code mono">{program.code || `#${program.id}`}</div>
            <h2>{program.title_ar}</h2>
            <div className="jh-meta">
              <span style={{ background: `${kindMeta.color}26`, borderColor: `${kindMeta.color}55`, color: kindMeta.color }}>
                <Icon n="flag" size={12} /> {kindMeta.ar}
              </span>
              <span><Icon n="badge" size={12} /> {statusMeta.ar}</span>
              <span><Icon n="building" size={12} /> {program.provider || '—'}</span>
              <span><Icon n="calendar" size={12} /> {program.start_date?.slice(0, 10) || '—'}</span>
              <span><Icon n="users" size={12} /> {program.enrolled_count || program.attendees || 0}/{program.capacity || '∞'}</span>
            </div>
          </div>
          <div className="jh-progress">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="44" cy="44" r="38" fill="none"
                stroke={kindMeta.color} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(overallProgress.pct / 100) * 238.76} 238.76`}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <div className="jh-pct">
              <b>{overallProgress.pct}%</b>
              <span>الإنجاز</span>
            </div>
          </div>
        </div>

        {/* 3 Phase pills */}
        <div className="phase-track">
          {phaseProgress.map((ph) => (
            <div key={ph.id} className="phase-pill" style={{ ['--pc' as string]: ph.color }}>
              <div className="pp-head">
                <span>{ph.t}</span>
                <span className="pp-pct">{ph.pct}%</span>
              </div>
              <div className="pp-title">{ph.dur}</div>
              <div className="pp-bar"><div style={{ width: `${ph.pct}%` }} /></div>
              <div className="pp-meta">{ph.doneTasks}/{ph.totalTasks} مهام</div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey grid: rail (right) + detail (left) */}
      <ProgramNomineesBanner programId={Number(params.id)} />
      <div className="journey-grid">
        {/* Rail */}
        <div className="journey-rail">
          <div className="jr-spine" />
          {STEPS.map((s) => {
            const ph = PHASES.find((p) => p.id === s.ph)!;
            const isActive = s.id === activeStep;
            const isCurStep = s.id === curStep;
            const isDone = s.id < curStep;
            const cls = [
              'jr-step',
              isActive ? 'sel' : '',
              isDone ? 'done' : '',
              isCurStep ? 'active' : '',
              s.id > curStep ? 'upcoming' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={s.id}
                className={cls}
                style={{
                  ['--pc' as string]: ph.color,
                  ['--pcbg' as string]: `${ph.color}1F`,
                }}
                onClick={() => setActiveStep(s.id)}
              >
                <div className="jrs-num">{s.id}</div>
                <div className="jrs-body">
                  <div className="jrs-ph">{ph.t}</div>
                  <div className="jrs-t">{s.t}</div>
                  <div className="jrs-meta">
                    {isCurStep && <span className="jrs-live"><i />جاري</span>}
                    {!isCurStep && <span>—</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="journey-detail" style={{ ['--pc' as string]: selPhase.color, ['--pcbg' as string]: `${selPhase.color}1F` }}>
          <div className="jd-head">
            <div className="jd-num">{selectedStep.id}</div>
            <div style={{ flex: 1 }}>
              <div className="jd-ph">{selPhase.t}</div>
              <h3>{selectedStep.t}</h3>
            </div>
            <div className="jd-stat">
              <b>{stepPct}%</b>
              <span>{stepDone}/{selectedStep.tasks.length} مهام</span>
            </div>
          </div>

          <div className="jd-progbar"><div style={{ width: `${stepPct}%` }} /></div>

          {/* Tasks */}
          <div className="jd-tasks">
            {selectedStep.tasks.map((task, ti) => {
              const ts = getTaskState(selectedStep.id, ti);
              return (
                <div key={ti} className={`jd-task ${ts.done ? 'done' : ''}`}>
                  <button
                    className={`jd-ck ${ts.done ? 'done' : ''}`}
                    onClick={() => toggleTask(selectedStep.id, ti, task)}
                    title={ts.done ? 'إلغاء الإقفال' : 'وضع علامة كمنجَزَة'}
                  >
                    {ts.done && <Icon n="check" size={14} />}
                  </button>
                  <div className="jd-tx" style={{ flex: 1 }}>
                    <b>{task}</b>
                    {ts.done && (ts.closed_by_name || ts.close_note) && (
                      <div className="jd-closed">
                        {ts.closed_by_name && (
                          <>
                            <Icon n="check2" size={10} /> أُقفلت بواسطة <b>{ts.closed_by_name}</b>
                          </>
                        )}
                        {ts.closed_at && ts.closed_at !== '—' && (
                          <>
                            <span className="jd-dot">·</span>
                            <span className="mono">{ts.closed_at.slice(0, 16).replace('T', ' ')}</span>
                          </>
                        )}
                        {ts.close_note && (
                          <>
                            <span className="jd-dot">·</span>
                            <span>"{ts.close_note}"</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick shortcut for step 6 (nominations) */}
          {selectedStep.linkTo && (
            <Link href={selectedStep.linkTo} className="jd-shortcut">
              <Icon n="inbox" size={16} />
              <span>الانتقال إلى شاشة الترشيحات لإدارة المتقدمين</span>
              <Icon n="chevL" size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Discussion forum (placeholder for Phase 4) */}
      <div className="forum-card">
        <div className="forum-head">
          <div>
            <h3>منتدى البرنامج</h3>
            <p className="forum-sub">نقاش مفتوح لأعضاء الفريق المشاركين في البرنامج. التنبيهات تُرسَل عبر النظام والإيميل تلقائياً.</p>
          </div>
        </div>
        <ProgramForum programId={Number(params.id)} />
      </div>

      {/* Close-task modal */}
      {closeModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'grid', placeItems: 'center', zIndex: 100, padding: 16,
          }}
          onClick={() => setCloseModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 480, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-head">
              <h3>إقفال المهمة</h3>
              <button onClick={() => setCloseModal(null)}><Icon n="x" size={16} /></button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>{closeModal.title}</p>
              <div className="field-sm">
                <label>ملاحظة (اختياري)</label>
                <textarea
                  rows={3}
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="أضف ملاحظة عن إقفال المهمة..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setCloseModal(null)}>إلغاء</button>
                <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={confirmClose}>
                  <Icon n="check" size={14} /> تأكيد الإقفال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
