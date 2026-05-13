'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, KeyRound, Loader2 } from 'lucide-react';

type Step = 'email' | 'code';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // اقرأ القيمة من DOM مباشرة لتجاوز مشكلة AutoFill ↔ React state
    const formData = new FormData(e.currentTarget);
    const emailValue = (formData.get('email') as string || email).trim();
    if (!emailValue || !emailValue.includes('@')) {
      setError('بريد إلكتروني غير صالح');
      return;
    }
    setEmail(emailValue);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذّر إرسال الرمز');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const codeValue = (formData.get('code') as string || code).trim();
    if (!/^\d{6}$/.test(codeValue)) {
      setError('الرمز يجب أن يكون 6 أرقام');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'الرمز غير صحيح');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <form onSubmit={requestCode}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>تسجيل الدخول</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
          أدخل بريدك الإلكتروني لإرسال رمز الدخول
        </p>

        <label className="label" htmlFor="email">البريد الإلكتروني</label>
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@dga.gov.sa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            style={{ paddingRight: 40 }}
          />
        </div>

        {error && <div className="badge badge-danger" style={{ marginTop: 12, padding: '8px 14px' }}>{error}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20, padding: '12px' }}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'إرسال رمز الدخول'}
          {!loading && <ArrowLeft size={16} />}
        </button>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
          ليس لديك حساب؟{' '}
          <a href="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>تسجيل جديد</a>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode}>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>أدخل الرمز</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
        أرسلنا رمزاً مكوّناً من ٦ أرقام إلى <strong>{email}</strong>
      </p>

      <label className="label" htmlFor="code">رمز الدخول</label>
      <div style={{ position: 'relative' }}>
        <KeyRound size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          className="input"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
          autoComplete="one-time-code"
          style={{ paddingRight: 40, fontSize: 22, letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {error && <div className="badge badge-danger" style={{ marginTop: 12, padding: '8px 14px' }}>{error}</div>}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: '12px' }} disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'دخول'}
      </button>

      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: '100%', marginTop: 8 }}
        onClick={() => { setStep('email'); setCode(''); setError(null); }}
      >
        تغيير البريد الإلكتروني
      </button>
    </form>
  );
}
