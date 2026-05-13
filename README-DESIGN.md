# 🎨 QTech Platform — Design Workbench FULL

نسخة كاملة للتطوير التصميمي.

## ✅ ما يعمل بالكامل
- **30+ صفحة** كلها مفتوحة بدون auth
- **3 ثيمات** (Dark, Navy, Light) جاهزة
- **بيانات تجريبية شاملة** (10 جهات، 5 برامج، 50 مستفيد، 8 إيميلات)
- **التنقل + Modals + Drawers + Tooltips**
- **Tailwind + الـ animations + الـ transitions**
- **اللوغو + Fonts + كل الـ assets**
- **Hot Reload** للتطوير السريع

## 🚀 ابدأ الآن

```bash
npm install
npm run dev
```

ثم افتح: **http://localhost:3000/sitemap-design** للوصول السريع لكل الصفحات.

## ☁️ نشر على Vercel

```bash
git init && git add . && git commit -m "design"
# ارفع على GitHub، ثم vercel.com/new → Deploy
```
لا حاجة لأي environment variables.

## 🎨 تطوير التصميم

1. عدّل أي ملف في `src/app/(portal)/*/page.tsx`
2. غيّر الـ Tailwind classes / الألوان / الـ animations
3. عند الانتهاء أرسل لـ Claude:
   ```bash
   git diff > my-changes.patch
   ```

## 📂 الهيكل

```
src/lib/mock-data.ts        ← بيانات تجريبية (عدّل كم تشاء)
src/lib/db.ts               ← Mock DB (يقرأ من mock-data)
src/lib/auth.ts             ← Mock Auth (super_admin)
src/app/sitemap-design/     ← خريطة الموقع (للتنقل السريع)
src/app/(portal)/           ← كل الصفحات
public/                     ← اللوغو، fonts، images
```

## 🎯 الـ Stack
- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS · Lucide React · Recharts
