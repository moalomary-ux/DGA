'use client';
import { useEffect, useState, useCallback } from 'react';
import QIcon from '@/components/QIcon';

interface Idea { id: number; title: string; type: string; status: string; description: string | null; priority: string; votes: number; author_name: string | null; created_at: string; comment_count: number; }

const TYPE_META: Record<string, { ar: string; color: string; icon: string }> = {
  training:    { ar:'موضوع تدريبي', color:'#7C32C9', icon:'book' },
  workshop:    { ar:'ورشة عمل',     color:'#FF8533', icon:'lightbulb' },
  partnership: { ar:'شراكة',        color:'#00ABAF', icon:'handshake' },
  challenge:   { ar:'تحدّي',        color:'#E03A4D', icon:'warning' },
};
const STATUSES = [
  { id:'idea',       ar:'فكرة جديدة',  color:'#7C32C9' },
  { id:'discussion', ar:'قيد النقاش',   color:'#3F7DD9' },
  { id:'planning',   ar:'في التخطيط',   color:'#FF8533' },
  { id:'approved',   ar:'معتمدة',      color:'#00B8A3' },
];

export default function FuturePlansPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [composing, setComposing] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', type: 'training', description: '' });

  const refresh = useCallback(() => {
    fetch('/api/ideas').then(r => r.json()).then(d => { if (d.ok) setIdeas(d.ideas); });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    if (!newIdea.title.trim()) return;
    await fetch('/api/ideas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'create', ...newIdea })});
    setNewIdea({ title:'', type:'training', description:'' });
    setComposing(false);
    refresh();
  };
  const upvote = async (id: number) => {
    await fetch('/api/ideas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'upvote', id })});
    refresh();
  };

  const list = ideas
    .filter(i => filter === 'all' || i.type === filter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter);
  const counts = STATUSES.reduce((a, st) => { a[st.id] = ideas.filter(i => i.status === st.id).length; return a; }, {} as Record<string, number>);

  return (
    <div className="page fade-in">
      {/* Hero */}
      <div className="card" style={{marginBottom:16,background:'linear-gradient(135deg,rgba(124,50,201,0.15),var(--bg-3))',border:'1px solid rgba(124,50,201,0.3)'}}>
        <div className="card-body" style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap'}}>
          <div style={{width:48,height:48,borderRadius:12,background:'var(--grad-1, var(--grad-purple))',color:'#fff',display:'grid',placeItems:'center'}}>
            <QIcon n="lightbulb" size={20}/>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,color:'var(--text-3)',letterSpacing:'.1em',fontFamily:'var(--font-en)',fontWeight:700,marginBottom:3}}>FUTURE PLANS · IDEAS</div>
            <h2 style={{fontSize:18,fontWeight:700}}>الخطط المستقبلية والأفكار</h2>
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {STATUSES.map(st => (
              <div key={st.id} style={{padding:'8px 14px',background:'var(--bg-3)',borderRadius:10,border:`1px solid ${st.color}33`,minWidth:90,textAlign:'center'}}>
                <div className="mono" style={{fontSize:20,fontWeight:700,color:st.color}}>{counts[st.id] || 0}</div>
                <div style={{fontSize:10,color:'var(--text-3)'}}>{st.ar}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" style={{width:'auto'}} onClick={()=>setComposing(c=>!c)}>
            <QIcon n={composing?'x':'plus'} size={14}/> {composing?'إلغاء':'فكرة جديدة'}
          </button>
        </div>
      </div>

      {composing && (
        <div className="card" style={{marginBottom:16}}>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:10}}>
            <input style={{padding:12,background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:8,color:'var(--text)',fontSize:15,fontWeight:600}}
                   placeholder="ما الفكرة؟ اكتب عنوانًا واضحًا..." value={newIdea.title}
                   onChange={e=>setNewIdea({...newIdea, title:e.target.value})} autoFocus/>
            <textarea style={{padding:12,background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:8,color:'var(--text)',fontSize:13,resize:'vertical',minHeight:60,fontFamily:'inherit'}}
                      placeholder="اشرح الفكرة باختصار..." value={newIdea.description}
                      onChange={e=>setNewIdea({...newIdea, description:e.target.value})} rows={2}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <button key={k}
                          style={{padding:'6px 12px',background:newIdea.type===k?m.color:'transparent',color:newIdea.type===k?'#fff':m.color,border:`1px solid ${m.color}`,borderRadius:99,cursor:'pointer',fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}
                          onClick={()=>setNewIdea({...newIdea, type:k})}>
                    <QIcon n={m.icon} size={11}/> {m.ar}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{width:'auto'}} onClick={submit}>
                <QIcon n="send" size={12}/> نشر الفكرة
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{marginBottom:16}}>
        <div className="card-body" style={{padding:14,display:'flex',gap:12,flexWrap:'wrap'}}>
          <div className="kind-filter">
            <button className={`kind-chip ${filter==='all'?'on':''}`} onClick={()=>setFilter('all')}
                    style={{['--kc' as string]:'var(--text-2)'} as React.CSSProperties}>
              <span className="kc-dot"></span>الكل<span className="mono kc-num">{ideas.length}</span>
            </button>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <button key={k} className={`kind-chip ${filter===k?'on':''}`} onClick={()=>setFilter(k)}
                      style={{['--kc' as string]:m.color} as React.CSSProperties}>
                <span className="kc-dot"></span><QIcon n={m.icon} size={11}/>{m.ar}
                <span className="mono kc-num">{ideas.filter(i => i.type === k).length}</span>
              </button>
            ))}
          </div>
          <div className="chips">
            <button className={`chip ${statusFilter==='all'?'active':''}`} onClick={()=>setStatusFilter('all')}>الكل</button>
            {STATUSES.map(st => (
              <button key={st.id} className={`chip ${statusFilter===st.id?'active':''}`} onClick={()=>setStatusFilter(st.id)}>
                <i style={{width:8,height:8,borderRadius:'50%',background:st.color,display:'inline-block',marginInlineEnd:4}}></i>{st.ar}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {list.map(idea => {
          const tm = TYPE_META[idea.type] || TYPE_META.training;
          const stm = STATUSES.find(x => x.id === idea.status) || STATUSES[0];
          return (
            <div key={idea.id} className="card" style={{borderInlineStart:`4px solid ${tm.color}`,padding:14,display:'flex',gap:14,alignItems:'flex-start'}}>
              <button onClick={()=>upvote(idea.id)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 12px',background:'var(--bg-2)',border:'1px solid var(--line)',borderRadius:8,cursor:'pointer',color:'var(--text-2)',minWidth:48}}>
                <QIcon n="trend" size={12}/>
                <b className="mono" style={{fontSize:14}}>{idea.votes || 0}</b>
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
                  <span className="kind-tag" style={{['--kc' as string]:tm.color} as React.CSSProperties}>
                    <QIcon n={tm.icon} size={10}/> {tm.ar}
                  </span>
                  <span className="pill" style={{background:`${stm.color}22`,color:stm.color,border:`1px solid ${stm.color}55`}}>
                    <i style={{width:6,height:6,borderRadius:'50%',background:stm.color,display:'inline-block',marginInlineEnd:4}}></i>{stm.ar}
                  </span>
                  {idea.priority === 'high' && <span className="pill" style={{background:'#E03A4D22',color:'#E03A4D',fontSize:10}}>أولوية عالية</span>}
                </div>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:6}}>{idea.title}</h3>
                <p style={{fontSize:13,color:'var(--text-2)',marginBottom:8,lineHeight:1.6}}>{idea.description}</p>
                <div style={{display:'flex',gap:10,fontSize:11,color:'var(--text-3)',alignItems:'center',flexWrap:'wrap'}}>
                  <span>{idea.author_name || '—'}</span>
                  <span>·</span>
                  <span className="mono">{idea.created_at?.slice(0,10)}</span>
                  <span>·</span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:3}}><QIcon n="chat" size={11}/> {idea.comment_count}</span>
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="card"><div className="card-body" style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>لا توجد أفكار</div></div>}
      </div>
    </div>
  );
}
