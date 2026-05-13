# Omary Platform — منصّة محمد العُمري

> نظام تشغيل داخلي للفريق — هيئة الحكومة الرقمية، المملكة العربية السعودية.

## ⚡ الفكرة

**كودبيس Next.js واحد** يخدم **ثلاث بوابات داخلية**:

| Domain | الجمهور | الدور |
|------|--------|------|
| `omary.cloud`     | محمد العمري (super_admin) | البوابة الأم |
| `advicedga.cloud` | فريق الاستشارات والدراسات | بوابة فرعية |
| `qtech.help`      | فريق المهارات الرقمية      | بوابة فرعية |

**كل المحتوى داخلي** للموظفين والفريق. **الوحيد المفتوح للجمهور** = صفحة `/register` (تستلم طلبات تسجيل، تجي عبر Telegram للموافقة).

## 📁 الهيكل

```
src/
├── middleware.ts                 ← يكتشف الـ tenant من Host
├── lib/
│   ├── tenant.ts                 ← تعريف 3 بوابات
│   ├── db.ts                     ← postgres-js client
│   ├── auth.ts                   ← iron-session helpers
│   ├── otp.ts                    ← توليد + hash OTP
│   ├── mail.ts                   ← SMTP عبر nodemailer
│   ├── bridge.ts                 ← client للـ Hermes Bridge
│   └── utils.ts
├── app/
│   ├── layout.tsx                ← RTL + tenant theme
│   ├── globals.css
│   ├── (public)/                 ← صفحات بدون auth
│   │   ├── layout.tsx            ← split: form | branding
│   │   ├── page.tsx              ← redirect
│   │   ├── login/                ← OTP من خطوتين
│   │   └── register/             ← التسجيل الذاتي
│   ├── (portal)/                 ← يتطلّب auth
│   │   ├── layout.tsx            ← Sidebar + Header
│   │   ├── dashboard/
│   │   ├── work/                 ← (placeholder)
│   │   ├── personal/             ← (omary فقط)
│   │   ├── skills/               ← يجلب من Bridge
│   │   ├── agents/               ← تشغيل skills
│   │   ├── tasks/                ← (placeholder)
│   │   ├── contacts/             ← Ecosystem
│   │   └── admin/
│   │       ├── registrations/    ← موافقة/رفض
│   │       └── users/            ← (placeholder)
│   └── api/
│       ├── auth/
│       │   ├── request-code/
│       │   ├── verify-code/
│       │   ├── register/
│       │   ├── logout/
│       │   └── approve/          ← يستدعيه Telegram bot
│       ├── admin/
│       │   └── decide/
│       └── bridge/
│           └── [skill]/          ← proxy لـ Hermes
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── portal/
│       └── Sidebar.tsx
└── styles/
    └── tokens.css                ← متغيرات + tenant overrides

migrations/
└── 001_initial.sql               ← schema + seed محمد
```

## 🚀 التشغيل المحلي

### 1. تثبيت الحزم

```bash
npm install --legacy-peer-deps
```

### 2. تشغيل PostgreSQL محلياً

```bash
docker run -d --name omary-pg \
  -e POSTGRES_USER=sami \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=sami \
  -p 5432:5432 \
  postgres:16
```

### 3. تشغيل migration

```bash
docker exec -i omary-pg psql -U sami -d sami < migrations/001_initial.sql
```

### 4. ضبط البيئة

```bash
cp .env.example .env.local
nano .env.local
```

عدّل خصوصاً:

```bash
DATABASE_URL=postgresql://sami:devpass@localhost:5432/sami
SESSION_SECRET=$(openssl rand -hex 32)
SMTP_USER=mhm@...
SMTP_PASS=...
```

### 5. تشغيل dev server

```bash
npm run dev
```

ادخل على `http://localhost:3000/login`.

## 🐳 النشر على VPS

### المتطلّبات (موجودة في `/opt/sami/`)

- ✅ Docker + Traefik
- ✅ Postgres container `sami-postgres`
- ✅ Network `sami_default`
- ✅ WireGuard للـ Mac mini

### خطوات النشر

```bash
# 1. على Mac mini
rsync -avz --exclude=node_modules --exclude=.next --exclude=.git \
  ~/Downloads/omary-platform/ root@187.77.79.237:/opt/omary/

# 2. على VPS
ssh root@187.77.79.237
cd /opt/omary

# 3. migration
docker exec -i sami-postgres psql -U sami -d sami < migrations/001_initial.sql

# 4. ضبط البيئة
cp .env.example .env
nano .env

# 5. نشر
docker compose build
docker compose up -d
docker compose logs omary-platform -f --tail=50
```

### الـ DNS

```
A   omary.cloud          → 187.77.79.237
A   advicedga.cloud      → 187.77.79.237
A   qtech.help           → 187.77.79.237
A   www.omary.cloud      → 187.77.79.237
A   www.advicedga.cloud  → 187.77.79.237
A   www.qtech.help       → 187.77.79.237
```

Traefik يجلب SSL لكل دومين تلقائياً.

## 🔐 Auth Flow

### Login (OTP من خطوتين)

```
POST /api/auth/request-code  { email }
   → يُولّد رمز 6 أرقام
   → hash بـ SHA-256
   → يُحفظ في auth_codes (TTL 15د)
   → يُرسل بالإيميل من tenant.smtpFrom

POST /api/auth/verify-code  { email, code }
   → يتحقّق من الـ hash
   → يُعلّم الرمز used
   → ينشئ iron-session cookie
```

### Register

```
POST /api/auth/register  { name_ar, email, position?, invite_code?, notes? }

── إن كان invite_code صالح ────
   user → active
   membership بدور default_role
   إيميل ترحيب فوراً

── بدون invite_code ──────────
   user → pending
   registration_request → pending
   POST → Bridge → Telegram لمحمد
   محمد يضغط ✅ → /api/auth/approve
   user → active
```

## 🛡️ الصلاحيات

| Role | الصلاحيات |
|---------------|----------|
| `super_admin` | كل شي + admin pages |
| `admin`       | إدارة محتوى البوابة |
| `editor`      | إنشاء + تعديل |
| `viewer`      | قراءة فقط |

محمد له `super_admin` على البوابات الثلاث.

## 🤖 Bridge Integration

`/skills` و `/agents` يتصلان بـ Hermes Bridge عبر WireGuard:

```
Browser → VPS (Next.js) → 10.10.10.2:7080 (Hermes) → ollama-cloud
                          ↑ Bearer token
```

لو Bridge مش متصل، الصفحات تعرض رسالة واضحة (لا crash).

## 🗂️ الجداول المهمّة

- `users` — الفريق فقط
- `tenants` — البوابات الثلاث
- `memberships` — user × tenant × role
- `auth_codes` — OTP (TTL 15د)
- `invite_codes` — DGA-XXXXXXXX
- `registration_requests` — طلبات pending
- `ecosystem_contacts` — مزامنة من Mac mini
- `audit_log` — كل فعل حسّاس

## 🔄 الخطوات التالية

- ربط Telegram bot بـ `/api/auth/approve`
- بناء `/admin/users` (memberships + invite codes UI)
- بناء `/work` (مراجعات + Monday integration)
- بناء `/personal` (notes للـ omary)
- مزامنة `ecosystem_contacts` من Mac mini كل 5د
