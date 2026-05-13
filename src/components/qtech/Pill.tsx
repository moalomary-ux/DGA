import type { ReactNode } from 'react';

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent';

export function Pill({ tone = 'muted', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`qt-pill ${tone}`}>{children}</span>;
}
