'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, ArrowRight, Sparkles, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import { Pill } from '@/components/qtech/Pill';

interface AgentInfo {
  id: string; slug: string; name_ar: string;
  emoji: string; description: string; status: string;
  capabilities: string[];
}

interface Msg {
  role: 'user' | 'agent' | 'error';
  content: string;
  cost?: number;
  ts: number;
}

export function AgentChatUI({ agent }: { agent: AgentInfo }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text, ts: Date.now() }]);
    setSending(true);

    try {
      const res = await fetch(`/api/agents/${agent.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });
      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, {
        role: data.ok ? 'agent' : 'error',
        content: data.reply || 'لا يوجد رد',
        cost: data.cost_usd,
        ts: Date.now(),
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: 'error', content: `خطأ في الاتصال: ${(e as Error).message}`, ts: Date.now(),
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
        <Link href="/agents" style={{ color: 'inherit' }}>الوكلاء الذكيون</Link>
        <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
        <span style={{ color: 'var(--text-2)' }}>{agent.name_ar}</span>
      </div>

      {/* Hero */}
      <div style={{
        background: 'var(--grad-1)', color: '#fff', borderRadius: 14,
        padding: 18, marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center',
          fontSize: 26, flexShrink: 0,
        }}>{agent.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{agent.name_ar}</h1>
            {agent.status === 'beta' && <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.05em',
            }}>BETA</span>}
          </div>
          <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>{agent.description}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {agent.capabilities.map((c) => (
              <span key={c} style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 99,
                background: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)',
              }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '4px 2px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 16px' }}>
            <Sparkles size={32} style={{ margin: '0 auto 10px', color: 'var(--primary)' }} />
            <p style={{ fontSize: 13, marginBottom: 4 }}>ابدأ المحادثة</p>
            <p style={{ fontSize: 11, color: 'var(--text-4)' }}>الوكيل سيفهم طلبك ويرد بشكل تنفيذي</p>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} m={m} agentEmoji={agent.emoji} />)
        )}
        {sending && (
          <div style={{ display: 'flex', gap: 10, padding: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-1)',
              display: 'grid', placeItems: 'center', fontSize: 16,
            }}>{agent.emoji}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{
        marginTop: 12, padding: 12, background: 'var(--surface)',
        border: '1px solid var(--line)', borderRadius: 14,
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea ref={inputRef} value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`اكتب طلبك للـ${agent.name_ar}...`}
          style={{
            flex: 1, minHeight: 44, maxHeight: 200, resize: 'none',
            border: 0, background: 'transparent', outline: 'none',
            fontSize: 13, fontFamily: 'inherit', color: 'var(--text)',
            lineHeight: 1.6,
          }} />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--grad-2)', color: '#fff', border: 0,
            display: 'grid', placeItems: 'center',
            cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
            opacity: !input.trim() || sending ? 0.5 : 1,
          }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function Bubble({ m, agentEmoji }: { m: Msg; agentEmoji: string }) {
  const isUser = m.role === 'user';
  const isError = m.role === 'error';
  return (
    <div style={{
      display: 'flex', gap: 10, padding: 12,
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isUser ? 'var(--bg-2)' : isError ? 'var(--danger-bg)' : 'var(--grad-1)',
        color: isUser ? 'var(--text)' : '#fff',
        display: 'grid', placeItems: 'center', flexShrink: 0,
        fontSize: 14,
      }}>
        {isUser ? <UserIcon size={14} /> : isError ? <AlertCircle size={14} style={{ color: 'var(--danger)' }} /> : agentEmoji}
      </div>
      <div style={{
        maxWidth: '78%', padding: '10px 14px', borderRadius: 12,
        background: isUser ? 'var(--primary-bg-2)' : isError ? 'var(--danger-bg)' : 'var(--bg-2)',
        color: isError ? 'var(--danger)' : 'var(--text)',
        border: `1px solid ${isError ? 'var(--danger)' : 'var(--line)'}`,
      }}>
        <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
        {m.cost !== undefined && m.cost > 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            ${m.cost.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)',
      animation: 'pulse 1.4s infinite', animationDelay: `${delay}ms`,
    }} />
  );
}
