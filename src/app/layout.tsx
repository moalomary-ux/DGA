import type { Metadata } from 'next';
import { headers, cookies } from 'next/headers';
import { detectTenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');
  return {
    title: tenant.nameAr,
    description: tenant.description,
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');

  // محاولة جلب theme من DB لو مستخدم مسجّل، وإلا cookie، وإلا 'dark'
  let theme: 'dark' | 'light' | 'navy' = 'dark';
  try {
    const session = await getSession();
    if (session.userId) {
      const rows = await db<{ theme: string }[]>`
        SELECT theme FROM user_preferences WHERE user_id = ${session.userId}
      `;
      if (rows.length && (rows[0].theme === 'light' || rows[0].theme === 'navy' || rows[0].theme === 'dark')) {
        theme = rows[0].theme as 'dark' | 'light' | 'navy';
      }
    }
  } catch {
    // الجدول ربما لم يُنشأ بعد، استخدم default
  }

  // qtech only — تطبيق الـ theme. omary و advice يبقون light
  const themeAttr = tenant.id === 'qtech' ? theme : 'light';

  return (
    <html lang="ar" dir="rtl" data-tenant={tenant.id} data-theme={themeAttr}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
