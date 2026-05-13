import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 21600; // 6h cache

export async function GET(_req: NextRequest) {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=Riyadh&country=SA&method=4`;

  try {
    const r = await fetch(url, { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error(`aladhan ${r.status}`);
    const data = await r.json();
    const t = data.data.timings;

    const prayers = [
      { name: 'الفجر',   time: t.Fajr.slice(0,5),   en: 'Fajr' },
      { name: 'الشروق',  time: t.Sunrise.slice(0,5), en: 'Sunrise' },
      { name: 'الظهر',   time: t.Dhuhr.slice(0,5),  en: 'Dhuhr' },
      { name: 'العصر',   time: t.Asr.slice(0,5),    en: 'Asr' },
      { name: 'المغرب',  time: t.Maghrib.slice(0,5),en: 'Maghrib' },
      { name: 'العشاء',  time: t.Isha.slice(0,5),   en: 'Isha' },
    ];

    return NextResponse.json({
      ok: true,
      city: 'الرياض',
      method: 'أم القرى',
      hijri: data.data.date.hijri,
      gregorian: data.data.date.gregorian,
      prayers,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}