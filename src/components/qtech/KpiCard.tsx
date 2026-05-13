'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: number;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  tone?: 'primary' | 'accent' | 'success' | 'warning';
  icon?: ReactNode;
  href?: string;
  /** نص قبل الرقم (مثل ر.س) */
  prefix?: string;
  /** نص بعد الرقم (مثل % أو متدرّب) */
  suffix?: string;
}

function useCounter(target: number, duration = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === 0) { setV(0); return; }
    let start: number | null = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function KpiCard({ label, value, delta, deltaTone = 'up', tone = 'primary', icon, href, prefix, suffix }: KpiCardProps) {
  const counted = useCounter(value);
  const display = `${prefix || ''}${Math.round(counted).toLocaleString('en-US')}${suffix || ''}`;
  const deltaCls = deltaTone === 'down' ? 'qt-kpi-delta dn' : deltaTone === 'flat' ? 'qt-kpi-delta flat' : 'qt-kpi-delta';

  const inner = (
    <div className="qt-kpi" data-tone={tone}>
      <div className="qt-kpi-row">
        <span className="qt-kpi-lbl">{label}</span>
        {icon && <span className="qt-kpi-ico">{icon}</span>}
      </div>
      <div className="qt-kpi-num">{display}</div>
      {delta && <div className={deltaCls}>{delta}</div>}
    </div>
  );

  if (href) return <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</a>;
  return inner;
}
