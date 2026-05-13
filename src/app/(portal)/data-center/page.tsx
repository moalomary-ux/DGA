import { headers } from 'next/headers';
import { detectTenant } from '@/lib/tenant';
import { DataCenterView } from './DataCenterView';

export const dynamic = 'force-dynamic';

export default async function DataCenterPage() {
  const h = await headers();
  const tenant = detectTenant(h.get('host') || 'localhost');

  if (tenant.id !== 'qtech') {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 16, color: 'var(--text-1)' }}>مركز البيانات</h1>
        <p style={{ color: 'var(--text-3)' }}>هذه الصفحة متاحة فقط في بوابة قدراتك.</p>
      </div>
    );
  }

  return <DataCenterView />;
}
