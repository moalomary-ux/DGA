'use client';

// /home/page.tsx — Direct port of mypage.jsx with real data
// Uses qudratok.css design system (NO Tailwind for this page).

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QIcon, { fmt, STATUS_META, TYPE_META } from '@/components/QIcon';

interface HomeData {
  user: { name: string; initials: string; email: string };
  myPrograms: { id: number; title_ar: string; code: string | null; provider: string | null; start_date: string | null; capacity: number | null; enrolled_count: number | null; status: string | null; attendees: number; program_type: string | null }[];
  upcoming: { id: number; title_ar: string; code: string | null; start_date: string; provider: string | null; category: string | null }[];
  myTasks: { id: string; title: string; due: string; priority: string; program: string | null; done: boolean }[];
  stats: { programs_count: number; tasks_count: number; pending_nominations: number; inbox_count: number; total_programs: number; total_orgs: number; total_people: number; };
}
interface WeatherData { ok: boolean; city: string; current: { temp: number; desc: string; is_day: boolean }; forecast: { date: string; max: number; min: number; label: string }[]; }
interface PrayerData { ok: boolean; city: string; method: string; hijri: { date: string; month: { ar: string }; day: string }; prayers: { name: string; time: string; en: string }[]; }
interface ChatMsg { r: 'u' | 'a'; t: string; model?: string; err?: boolean; }

const MODELS = [
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.5', tag: 'الافتراضي', desc: 'متوازن · الأنسب للأعمال اليومية' },
  { id: 'claude-opus',   name: 'Claude Opus 4',     tag: 'الأذكى',     desc: 'تحليل عميق · مهام معقّدة' },
  { id: 'claude-haiku',  name: 'Claude Haiku 4.5',  tag: 'السريع',     desc: 'إجابات فورية' },
];

const SUGGESTIONS = ['كم برنامجاً نشطاً لدي؟', 'اكتب إيميل ترحيب للمتدربين', 'لخّص أداء البرامج هذا الشهر', 'اقترح موعد لورشة قادمة'];

export default function MyPage() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prayer, setPrayer] = useState<PrayerData | null>(null);
  const [news, setNews] = useState<{ category: string; title: string; source: string; url: string; time: string; tag: string }[]>([]);
  const [time, setTime] = useState(new Date());
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [askQ, setAskQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [model, setModel] = useState('claude-sonnet');
  const [modelOpen, setModelOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/home/data').then(r => r.json()).then(d => { if (d.ok) setData(d); });
    fetch('/api/home/weather').then(r => r.json()).then(d => { if (d.ok) setWeather(d); });
    fetch('/api/home/prayer').then(r => r.json()).then(d => { if (d.ok) setPrayer(d); });
    fetch('/api/home/news').then(r => r.json()).then(d => {
      if (d.ok) {
        // map server format to mypage tag (eco/sport/pol/tech)
        const map: Record<string, string> = { 'اقتصاد':'eco','رياضة':'sport','سياسة':'pol','تقنية':'tech' };
        setNews(d.items.map((n: { category: string; title: string; source: string; url: string; time: string }) => ({ ...n, tag: map[n.category] || 'tech' })));
      }
    });
  }, []);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chat, asking]);

  const goTo = (page: string, arg?: string | number) => router.push(arg ? `/${page}/${arg}` : `/${page}`);

  // Greeting
  const h = time.getHours();
  const greet = h < 5 ? 'مساء الخير' : h < 12 ? 'صباح الخير' : h < 18 ? 'طاب يومك' : 'مساء الخير';
  const dayName = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][time.getDay()];
  const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][time.getMonth()];
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');

  // Calendar event days
  const today = new Date();
  const eventDays = new Set((data?.myPrograms || []).flatMap(p => {
    if (!p.start_date) return [];
    const d = new Date(p.start_date);
    return d.getMonth() === today.getMonth() ? [d.getDate()] : [];
  }));

  // Prayer next
  const nowMin = time.getHours() * 60 + time.getMinutes();
  const prayerData = prayer?.prayers || [];
  const prayerMins = prayerData.map(p => { const [hh, mm] = p.time.split(':').map(Number); return hh * 60 + mm; });
  let nextIdx = prayerMins.findIndex(m => m > nowMin);
  if (nextIdx === -1) nextIdx = 0;
  const nextPrayer = prayerData[nextIdx];
  const minsToNext = nextPrayer ? (nextIdx === 0 ? 1440 - nowMin + prayerMins[0] : prayerMins[nextIdx] - nowMin) : 0;
  const hToNext = Math.floor(minsToNext / 60), mToNext = minsToNext % 60;

  // Send chat
  const askIt = useCallback(async (q?: string) => {
    const text = (q || askQ).trim();
    if (!text || asking) return;
    setChat(c => [...c, { r: 'u', t: text }]);
    setAskQ(''); setAsking(true);
    try {
      const r = await fetch('/api/home/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model }),
      });
      const d = await r.json();
      setChat(c => [...c, d.ok
        ? { r: 'a', t: d.reply, model: d.model || MODELS.find(m => m.id === model)?.name }
        : { r: 'a', t: `خطأ: ${d.error || 'تعذّر الاتصال'}`, err: true }
      ]);
    } catch { setChat(c => [...c, { r: 'a', t: 'تعذّر الاتصال بالنموذج. حاول مرة أخرى.', err: true }]); }
    setAsking(false);
  }, [askQ, asking, model]);

  if (!data) {
    return (
      <div className="page" style={{padding:60,textAlign:'center'}}>
        <div className="spin" style={{margin:'0 auto'}}/>
        <div style={{marginTop:16,color:'var(--text-3)'}}>جارٍ تحميل صفحتك...</div>
      </div>
    );
  }

  const me = data.user;
  const stats = data.stats;
  const myPrograms = data.myPrograms;
  const myTasks = data.myTasks;
  const upcoming = data.upcoming;
  const currentModel = MODELS.find(m => m.id === model)!;

  return (
    <div className="mypage fade-in">
      {/* Hero Header */}
      <div className="mp-hero">
        <div className="mp-hero-bg">
          <div className="orb o1"></div><div className="orb o2"></div><div className="orb o3"></div>
        </div>
        <div className="mp-hero-content">
          <div className="mp-greet">
            <div className="mp-greet-row">
              <div className="mp-av">{me.initials || 'م'}</div>
              <div>
                <div className="mp-eyebrow">{dayName} · {time.getDate()} {monthName} · <span className="mono" dir="ltr">{hh}:{mm}</span></div>
                <h1>{greet}، <span>{me.name?.split(' ')[0] || 'مستخدم'}</span></h1>
                <p>لديك <b>{myTasks.length}</b> مهام مفتوحة، و <b>{myPrograms.length}</b> برامج جارية. هذا ملخص يومك.</p>
              </div>
            </div>
          </div>
          <div className="mp-quickstats">
            <div className="qstat"><span className="lbl">برامجي</span><b className="num">{fmt(stats.programs_count)}</b><span className="dt up">+1 هذا الأسبوع</span></div>
            <div className="qstat"><span className="lbl">مهام اليوم</span><b className="num">{fmt(stats.tasks_count)}</b><span className="dt warning">عاجل</span></div>
            <div className="qstat"><span className="lbl">ترشيحات معلّقة</span><b className="num">{fmt(stats.pending_nominations)}</b><span className="dt">تحتاج مراجعة</span></div>
            <div className="qstat"><span className="lbl">رسائل واردة</span><b className="num">{fmt(stats.inbox_count)}</b><span className="dt up">+3 جديدة</span></div>
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div className="bento">
        {/* AI Chat — Claude-like */}
        <div className="bento-card claude-chat">
          <div className="cc-header">
            <div className="cc-brand">
              <div className="cc-logo"><QIcon n="sparkles" size={16}/></div>
              <div>
                <b>قدراتك الذكي</b>
                <span>مساعد متصل بنماذج متعددة</span>
              </div>
            </div>
            <button className="cc-model" onClick={() => setModelOpen(o => !o)}>
              <span className="cc-model-name">{currentModel.name}</span>
              <QIcon n="chevD" size={12}/>
              {modelOpen && (
                <div className="cc-model-menu" onClick={e => e.stopPropagation()}>
                  {MODELS.map(m => (
                    <button key={m.id} className={`cc-model-opt ${m.id === model ? 'sel' : ''}`}
                            onClick={() => { setModel(m.id); setModelOpen(false); }}>
                      <div>
                        <b>{m.name}</b>
                        <span>{m.desc}</span>
                      </div>
                      <span className="cc-tag">{m.tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div className="cc-body" ref={chatRef}>
            {chat.length === 0 && (
              <div className="cc-welcome">
                <div className="cc-welcome-orb"><QIcon n="sparkles" size={26}/></div>
                <h3>كيف أساعدك اليوم، {me.name?.split(' ')[0] || ''}؟</h3>
                <p>اسألني عن البرامج، الترشيحات، أو دعني أكتب لك إيميلاً.</p>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`cc-msg ${m.r}`}>
                {m.r === 'a' && <div className="cc-av"><QIcon n="bot" size={13}/></div>}
                <div className="cc-bubble">
                  {m.t}
                  {m.model && <div className="cc-via">عبر {m.model}</div>}
                </div>
              </div>
            ))}
            {asking && (
              <div className="cc-msg a">
                <div className="cc-av"><QIcon n="bot" size={13}/></div>
                <div className="cc-bubble"><div className="cc-typing"><span></span><span></span><span></span></div></div>
              </div>
            )}
          </div>

          {chat.length === 0 && (
            <div className="ai-suggest">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => askIt(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="cc-input">
            <button className="cc-attach" title="إرفاق ملف"><QIcon n="plus" size={14}/></button>
            <input value={askQ} onChange={e => setAskQ(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && askIt()}
                   placeholder={`اسأل ${currentModel.name}...`}/>
            <button className="cc-send" onClick={() => askIt()} disabled={asking || !askQ.trim()}>
              {asking ? <span className="spin"/> : <QIcon n="send" size={14}/>}
            </button>
          </div>
        </div>

        {/* Combined Info Strip — Weather · Prayer · Calendar · News */}
        <div className="bento-card info-strip">
          <div className="info-bg"></div>

          <div className="info-seg seg-weather">
            <div className="info-icon weather-ico">
              <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="11" fill="#FFC857" className="sun"/>
                <g className="rays" stroke="#FFC857" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="32" y1="12" x2="32" y2="17"/>
                  <line x1="32" y1="47" x2="32" y2="52"/>
                  <line x1="12" y1="32" x2="17" y2="32"/>
                  <line x1="47" y1="32" x2="52" y2="32"/>
                  <line x1="18" y1="18" x2="22" y2="22"/>
                  <line x1="42" y1="42" x2="46" y2="46"/>
                  <line x1="46" y1="18" x2="42" y2="22"/>
                  <line x1="22" y1="42" x2="18" y2="46"/>
                </g>
              </svg>
            </div>
            <div className="info-body">
              <div className="info-l1"><span className="info-lbl">{weather?.city || 'الرياض'}</span></div>
              <div className="info-l2">
                <span className="big mono">{weather?.current.temp ?? '--'}°</span>
                <span className="small">{weather?.current.desc || '—'}</span>
              </div>
              <div className="info-l3 mono">
                {weather?.forecast.slice(0,3).map((f,i) => (<span key={i}>{f.label} {f.max}°</span>))}
              </div>
            </div>
          </div>

          <div className="info-divider"></div>

          <div className="info-seg seg-prayer">
            <div className="info-icon"><QIcon n="badge" size={20}/></div>
            <div className="info-body">
              <div className="info-l1"><span className="info-lbl">الصلاة القادمة</span></div>
              <div className="info-l2">
                <span className="big">{nextPrayer?.name || '—'}</span>
                <span className="small mono">{nextPrayer?.time || '--:--'}</span>
              </div>
              <div className="info-l3 muted-txt">بعد <b className="mono">{hToNext > 0 ? `${hToNext}س ` : ''}{mToNext}د</b></div>
            </div>
          </div>

          <div className="info-divider"></div>

          <div className="info-seg seg-cal" onClick={() => goTo('calendar')} style={{cursor:'pointer'}}>
            <div className="info-icon"><QIcon n="calendar" size={20}/></div>
            <div className="info-body">
              <div className="info-l1"><span className="info-lbl">{monthName} {today.getFullYear()}</span></div>
              <div className="info-l2">
                <span className="big mono">{today.getDate()}</span>
                <span className="small">{dayName}</span>
              </div>
              <div className="info-l3 muted-txt">{eventDays.size} حدث هذا الشهر</div>
            </div>
          </div>

          <div className="info-divider"></div>

          <div className="info-seg seg-news">
            <div className="info-icon"><QIcon n="globe" size={20}/></div>
            <div className="info-body">
              <div className="info-l1"><span className="info-lbl">آخر الأخبار</span></div>
              <div className="news-ticker">
                {news.slice(0,3).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener" className="news-tick">
                    <span className={`news-tag ${n.tag}`}>{n.category}</span>
                    <b>{n.title}</b>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* My Programs */}
        <div className="bento-card programs-card wide">
          <div className="bc-head">
            <b><QIcon n="book" size={15}/> برامجي المسندة</b>
            <button className="link-btn" onClick={() => goTo('programs')}>عرض الكل ({stats.total_programs}) <QIcon n="chevR" size={12}/></button>
          </div>
          <div className="my-prog-list">
            {myPrograms.length === 0 && <div style={{padding:'40px 20px',textAlign:'center',color:'var(--text-3)'}}>لا توجد برامج مسندة حالياً</div>}
            {myPrograms.map(p => {
              const meta = STATUS_META[p.status || 'execution'] || STATUS_META.closed;
              const cap = p.capacity || 0;
              const enr = p.enrolled_count || p.attendees || 0;
              const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0;
              const typeMeta = TYPE_META[p.program_type || 'local'] || TYPE_META.local;
              return (
                <button key={p.id} className="my-prog" onClick={() => goTo('programs', p.id)}>
                  <div className="mp-head">
                    <div>
                      <span className="code mono">{p.code || `#${p.id}`}</span>
                      <h4>{p.title_ar}</h4>
                      <span className="partner">{p.provider || '—'}</span>
                    </div>
                    <span className={`pill ${meta.class}`}>{meta.ar}</span>
                  </div>
                  <div className="mp-prog">
                    <div className="mp-prog-bar"><div className="mp-prog-fill" style={{width:pct+'%'}}></div></div>
                    <span className="mono">{pct}%</span>
                  </div>
                  <div className="mp-foot">
                    <span><QIcon n="users" size={12}/> {enr}/{cap || '∞'}</span>
                    <span><QIcon n="calendar" size={12}/> {p.start_date?.slice(0,10) || '—'}</span>
                    <span><QIcon n="globe" size={12}/> {typeMeta.ar}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bento-card tasks-card">
          <div className="bc-head">
            <b><QIcon n="check2" size={15}/> مهامي اليوم</b>
            <span className="muted-txt">{myTasks.length} مهام</span>
          </div>
          <div className="task-mini-list">
            {myTasks.length === 0 && <div style={{padding:'24px 12px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>لا توجد مهام جديدة 🎉</div>}
            {myTasks.map(t => (
              <div key={t.id} className="task-mini">
                <div className={`tck ${t.priority}`}></div>
                <div className="tx">
                  <b>{t.title}</b>
                  <span>{t.due} · {t.program || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bento-card upcoming-card">
          <div className="bc-head"><b><QIcon n="rocket" size={15}/> القادم</b></div>
          <div className="up-list">
            {upcoming.length === 0 && <div style={{padding:'24px 12px',textAlign:'center',color:'var(--text-3)',fontSize:13}}>لا توجد برامج قادمة</div>}
            {upcoming.map(p => {
              const d = new Date(p.start_date);
              return (
                <button key={p.id} className="up-item" onClick={() => goTo('programs', p.id)}>
                  <div className="up-date">
                    <b className="mono">{d.getDate()}</b>
                    <span>{['ينا','فبر','مار','أبر','ماي','يون','يول','أغس','سبت','أكت','نوف','ديس'][d.getMonth()]}</span>
                  </div>
                  <div className="up-body">
                    <b>{p.title_ar}</b>
                    <span className="mono code">{p.code || `#${p.id}`} · {p.provider || '—'}</span>
                  </div>
                  <QIcon n="chevR" size={14}/>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="bento-card quicklinks-card">
          <div className="bc-head"><b><QIcon n="rocket" size={15}/> إجراءات سريعة</b></div>
          <div className="ql-grid">
            <button className="ql" onClick={() => goTo('programs')}><QIcon n="plus" size={16}/><span>برنامج جديد</span></button>
            <button className="ql" onClick={() => goTo('nominations')}><QIcon n="inbox" size={16}/><span>مراجعة الترشيحات</span></button>
            <button className="ql" onClick={() => goTo('agents')}><QIcon n="bot" size={16}/><span>وكلاء AI</span></button>
            <button className="ql" onClick={() => goTo('dashboard')}><QIcon n="chart" size={16}/><span>تقاريري</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
