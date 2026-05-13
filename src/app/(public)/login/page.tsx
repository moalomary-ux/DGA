import { headers } from 'next/headers';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { detectTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

const BG: Record<string, string> = { qtech: '/bg-1.png', advice: '/bg-2.png', omary: '/bg-3.png' };

const STYLES = `
  @keyframes aurora-shift {
    0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 0.65; }
    33% { transform: translate(8%, -6%) scale(1.15) rotate(40deg); opacity: 0.85; }
    66% { transform: translate(-7%, 5%) scale(1.1) rotate(80deg); opacity: 0.75; }
  }
  @keyframes logo-pulse {
    0%, 100% { transform: scale(1); opacity: 0.55; }
    50% { transform: scale(1.18); opacity: 0.85; }
  }
  @keyframes ring-expand {
    0% { transform: scale(0.7); opacity: 0.7; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  .aurora-1 { position: fixed; inset: -30%; z-index: 1;
    background: radial-gradient(circle at 30% 30%, rgba(124,50,201,0.45), transparent 50%);
    filter: blur(60px); animation: aurora-shift 18s ease-in-out infinite; pointer-events: none; }
  .aurora-2 { position: fixed; inset: -30%; z-index: 1;
    background: radial-gradient(circle at 70% 70%, rgba(0,171,175,0.4), transparent 50%);
    filter: blur(70px); animation: aurora-shift 24s ease-in-out infinite reverse; pointer-events: none; }
  .pulse-1 { position: fixed; top: 18%; right: 14%; width: 420px; height: 420px; z-index: 1;
    background: radial-gradient(circle, rgba(124,50,201,0.28), transparent 60%);
    filter: blur(40px); animation: logo-pulse 5s ease-in-out infinite; pointer-events: none; }
  .pulse-2 { position: fixed; bottom: 14%; left: 8%; width: 340px; height: 340px; z-index: 1;
    background: radial-gradient(circle, rgba(0,171,175,0.22), transparent 60%);
    filter: blur(40px); animation: logo-pulse 6s ease-in-out infinite 1.8s; pointer-events: none; }
  .logo-halo {
    position: absolute; left: 50%; top: 50%; width: 540px; height: 540px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle,
      rgba(0,171,175,0.30) 0%,
      rgba(80,40,180,0.18) 35%,
      transparent 65%);
    filter: blur(50px);
    animation: logo-pulse 4.5s ease-in-out infinite;
    pointer-events: none; z-index: 0;
  }
  .ring {
    position: absolute; left: 50%; top: 50%;
    width: 220px; height: 220px;
    margin-left: -110px; margin-top: -110px;
    border: 1px solid rgba(0,171,175,0.4);
    border-radius: 50%;
    animation: ring-expand 3.5s ease-out infinite;
    pointer-events: none;
  }
  .ring-2 { animation-delay: 1.2s; border-color: rgba(124,50,201,0.4); }
  .ring-3 { animation-delay: 2.4s; border-color: rgba(0,171,175,0.3); }
`;

export default async function LoginPage() {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');
  const bg = BG[tenant.id] ?? '/bg-1.png';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div data-theme="dark" style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: 'url(' + bg + ')', backgroundSize: 'cover',
          backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />

        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(8,6,28,0.55) 0%, rgba(15,12,48,0.45) 50%, rgba(10,30,50,0.45) 100%)' }} />

        <div className="aurora-1" />
        <div className="aurora-2" />
        <div className="pulse-1" />
        <div className="pulse-2" />

        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 1,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)' }} />

        <main style={{ position: 'relative', zIndex: 3, flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

          {/* Logo with pulse halo + concentric rings */}
          <div style={{ position: 'relative', marginBottom: 32, display: 'grid', placeItems: 'center', minHeight: 140 }}>
            <div className="logo-halo" />
            <div className="ring" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
            <Link href="/" style={{ position: 'relative', zIndex: 2, display: 'block' }}>
              <img src="/logo-qudratok.png" alt={tenant.nameAr}
                style={{ height: 'auto', maxWidth: 'min(320px, 70vw)', display: 'block',
                  filter: 'drop-shadow(0 10px 32px rgba(0,0,0,0.6))' }} />
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: 440,
            background: 'rgba(8, 6, 22, 0.65)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 22, padding: '36px 28px',
            boxShadow: '0 28px 72px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(124,50,201,0.15)' }}>
            <LoginForm />
          </div>

          <p style={{ marginTop: 22, textAlign: 'center', maxWidth: 440,
            color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, padding: '0 12px' }}>
            {tenant.description}
          </p>
        </main>

        <footer style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '20px 16px',
          color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.18em' }}>
          Digital Skills · 2026
        </footer>
      </div>
    </>
  );
}
