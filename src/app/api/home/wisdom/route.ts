import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WISDOM = [
  { ar: 'اطلب العلم من المهد إلى اللحد', en: 'Seek knowledge from cradle to grave' },
  { ar: 'إن مع العسر يسراً', en: 'With hardship comes ease' },
  { ar: 'العلم زين والجهل شين', en: 'Knowledge is beauty, ignorance is shame' },
  { ar: 'من سار على الدرب وصل', en: 'He who walks the path arrives' },
  { ar: 'الوقت كالسيف إن لم تقطعه قطعك', en: 'Time is a sword: cut it before it cuts you' },
  { ar: 'من جدَّ وجد ومن زرع حصد', en: 'He who strives finds; he who sows reaps' },
  { ar: 'خير الناس أنفعهم للناس', en: 'The best of people are those most useful to others' },
  { ar: 'الصبر مفتاح الفرج', en: 'Patience is the key to relief' },
  { ar: 'خير الكلام ما قلَّ ودلَّ', en: 'The best speech is brief and meaningful' },
  { ar: 'كل إناء بما فيه ينضح', en: 'Every vessel pours out what is within it' },
  { ar: 'العقل السليم في الجسم السليم', en: 'A sound mind in a sound body' },
  { ar: 'الكتاب خير جليس في الزمان', en: 'A book is the best companion in time' },
  { ar: 'البلاغة الإيجاز', en: 'Eloquence is brevity' },
  { ar: 'من تأنى أدرك ما تمنى', en: 'He who is patient attains what he desires' },
  { ar: 'إذا تم العقل نقص الكلام', en: 'When the mind matures, words diminish' },
  { ar: 'خير الأمور أوسطها', en: 'The best of matters is the middle path' },
  { ar: 'العالم بلا عمل كشجرة بلا ثمر', en: 'Knowledge without action is a tree without fruit' },
  { ar: 'لا يلدغ المؤمن من جحر مرتين', en: 'A wise person is not bitten twice from the same hole' },
  { ar: 'كن جميلاً ترَ الوجود جميلاً', en: 'Be beautiful and the world will appear beautiful' },
  { ar: 'إذا غامرت في شرف مروم فلا تقنع بما دون النجوم', en: 'When seeking honor, settle for nothing less than the stars' },
  { ar: 'من علَّمني حرفاً صرت له عبداً', en: 'Whoever teaches me a letter, I become indebted to them' },
  { ar: 'الرفق ما كان في شيء إلا زانه', en: 'Gentleness adorns everything it touches' },
  { ar: 'القناعة كنز لا يفنى', en: 'Contentment is an inexhaustible treasure' },
  { ar: 'إنما الأعمال بالنيات', en: 'Actions are judged by intentions' },
  { ar: 'تواضع تكن كالنجم لاح لناظر', en: 'Be humble like a star visible to the beholder' },
  { ar: 'العين بصيرة واليد قصيرة', en: 'The eye sees but the hand cannot reach' },
  { ar: 'رب أخ لك لم تلده أمك', en: 'Many a brother you have whom your mother did not bear' },
  { ar: 'الناس على دين ملوكهم', en: 'People follow the way of their leaders' },
  { ar: 'من قرع باباً ولج', en: 'He who knocks persistently enters' },
  { ar: 'الحياة كقطعة جليد، استمتع بها قبل أن تذوب', en: 'Life is like ice; enjoy it before it melts' },
];

export async function GET() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const w = WISDOM[dayOfYear % WISDOM.length];
  return NextResponse.json({ ok: true, wisdom: w, dayOfYear });
}
