'use client';
import Link from 'next/link';
import { 
  Home, Mail, Database, Users, Award, FileText, BookOpen, 
  MessageSquare, Briefcase, Calendar, Settings, BarChart3, 
  FolderOpen, UserCog, Sparkles, Building2, Layers, Bell,
  ClipboardList, Globe, Phone
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'الصفحات الرئيسية',
    color: 'teal',
    pages: [
      { href: '/home', label: 'الرئيسية', icon: Home },
      { href: '/dashboard', label: 'لوحة القيادة', icon: BarChart3 },
      { href: '/personal', label: 'صفحتي', icon: UserCog },
    ],
  },
  {
    title: 'العمل التشغيلي',
    color: 'purple',
    pages: [
      { href: '/communication', label: 'مركز التواصل', icon: Mail },
      { href: '/data-center', label: 'مركز البيانات', icon: Database },
      { href: '/contacts', label: 'جهات الاتصال', icon: Users },
      { href: '/calendar', label: 'التقويم', icon: Calendar },
      { href: '/files', label: 'الملفات', icon: FolderOpen },
    ],
  },
  {
    title: 'البرامج والتدريب',
    color: 'amber',
    pages: [
      { href: '/programs', label: 'البرامج وورش العمل', icon: Award },
      { href: '/nominations', label: 'الترشيحات', icon: ClipboardList },
      { href: '/skills', label: 'مساعد قدراتك', icon: Sparkles },
      { href: '/studies', label: 'الدراسات', icon: BookOpen },
      { href: '/consultations', label: 'الاستشارات', icon: MessageSquare },
    ],
  },
  {
    title: 'الإدارة',
    color: 'indigo',
    pages: [
      { href: '/orgs', label: 'الجهات', icon: Building2 },
      { href: '/partners', label: 'الشراكات والأفكار', icon: Briefcase },
      { href: '/clients', label: 'العملاء', icon: Users },
      { href: '/admin', label: 'الإدارة', icon: Settings },
      { href: '/services', label: 'الخدمات', icon: Layers },
      { href: '/agents', label: 'الوكلاء', icon: UserCog },
    ],
  },
  {
    title: 'الأدوات',
    color: 'cyan',
    pages: [
      { href: '/assistant', label: 'المساعد', icon: Sparkles },
      { href: '/forum', label: 'المنتدى', icon: MessageSquare },
      { href: '/monday', label: 'Monday', icon: Briefcase },
      { href: '/tasks', label: 'المهام', icon: ClipboardList },
      { href: '/workspace', label: 'مساحة العمل', icon: FolderOpen },
      { href: '/reports', label: 'التقارير', icon: FileText },
      { href: '/future-plans', label: 'الخطط المستقبلية', icon: Globe },
      { href: '/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30 hover:border-teal-500 hover:bg-teal-500/10 text-teal-300',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 text-purple-300',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-amber-300',
  indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-300',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-300',
};

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-100 mb-3 bg-gradient-to-l from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            🗺️ خريطة الموقع — Design Workbench
          </h1>
          <p className="text-zinc-400 text-sm">انقر على أي صفحة للوصول إليها مباشرة. كل الصلاحيات مفعّلة.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">✓ كامل الوصول</span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">🎨 كل الثيمات</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">📊 بيانات تجريبية</span>
          </div>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-lg font-bold text-zinc-200 mb-3 flex items-center gap-2">
                <span className={`w-1 h-5 rounded-full bg-${sec.color}-400`} />
                {sec.title}
                <span className="text-xs text-zinc-500 font-normal">({sec.pages.length} صفحات)</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sec.pages.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Link key={p.href} href={p.href}
                      className={`bg-gradient-to-br ${COLOR_MAP[sec.color]} border rounded-xl p-4 transition-all group`}>
                      <Icon size={20} className="mb-2 opacity-80 group-hover:scale-110 transition" />
                      <div className="text-sm font-bold text-zinc-100 mb-1">{p.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{p.href}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500">
          <p>QTech Platform — Design Workbench Edition</p>
          <p className="mt-1">عدّل التصميم وأرسل التغييرات لـ Claude</p>
        </div>
      </div>
    </div>
  );
}
