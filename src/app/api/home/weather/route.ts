import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 min cache

export async function GET(_req: NextRequest) {
  // الرياض: 24.7136, 46.6753
  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=24.7136&longitude=46.6753'
    + '&current=temperature_2m,weather_code,is_day'
    + '&daily=temperature_2m_max,temperature_2m_min,weather_code'
    + '&timezone=Asia%2FRiyadh&forecast_days=4';

  try {
    const r = await fetch(url, { next: { revalidate: 1800 } });
    if (!r.ok) throw new Error(`weather api ${r.status}`);
    const data = await r.json();

    return NextResponse.json({
      ok: true,
      city: 'الرياض',
      current: {
        temp: Math.round(data.current.temperature_2m),
        code: data.current.weather_code,
        is_day: data.current.is_day === 1,
        desc: weatherDesc(data.current.weather_code),
      },
      forecast: data.daily.time.slice(0, 4).map((d: string, i: number) => ({
        date: d,
        max: Math.round(data.daily.temperature_2m_max[i]),
        min: Math.round(data.daily.temperature_2m_min[i]),
        code: data.daily.weather_code[i],
        label: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : dayName(d),
      })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

function weatherDesc(code: number): string {
  if (code === 0) return 'صحو';
  if (code <= 3) return 'غائم جزئياً';
  if (code <= 48) return 'ضباب';
  if (code <= 67) return 'مطر';
  if (code <= 77) return 'ثلج';
  if (code <= 82) return 'زخات';
  if (code <= 99) return 'عاصفة';
  return 'متغيّر';
}
function dayName(dateStr: string): string {
  const d = new Date(dateStr);
  return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()];
}