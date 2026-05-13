# 🌐 SAMI Ecosystem — Architecture Reference

نظام محمد العُمري — Sovereign Executive Operating System (SEOS).

هذا الملف هو **المرجع الأساسي** للنظام كله. كل تطوير لاحق يبدأ من هنا.

---

## 🏛️ الطبقات الثلاث

### Layer 1 — مدخل المستخدم (Web)
- **qtech.help** → بوابة قدراتك (المهارات الرقمية)
- **advicedga.cloud** → بوابة الاستشارات والدراسات
- **omary.cloud** / **app.omary.cloud** → بوابة محمد الشخصية (super_admin)

كل البوابات على نفس الـ codebase (qtech-platform Next.js)، مفصولة عبر `host header` → tenant detection.

### Layer 2 — VPS Frankfurt (`187.77.79.237`)
| الخدمة | الدور |
|---|---|
| Traefik v3 | TLS termination + routing للـ 3 dominate |
| qtech-platform (Next.js 16) | الواجهة + Business logic |
| PostgreSQL 16 | Source of truth للبيانات (22 جدول) |
| Hostinger SMTP | إرسال إيميلات (3 حسابات: noreply/help/skills) |

### Layer 3 — Mac mini Riyadh (محرّك التنفيذ)
| المكوّن | الدور |
|---|---|
| Bridge API :7080 | Bearer-auth REST gateway |
| Hermes Agent v0.11 | العقل المدبّر (multi-agent orchestrator) |
| 240 Skills (18 فئة) | المهام التنفيذية المخصّصة |
| 8 LLMs | Claude Sonnet 4.6 (default) + 7 أخرى (Ollama, MiniMax) |

**الجسر بين 2 و 3**: WireGuard tunnel مشفّر، 111ms latency Frankfurt ↔ Riyadh.

---

## 🔐 أمن النظام

| الطبقة | الحماية |
|---|---|
| Web | HTTPS عبر Let's Encrypt (Traefik) |
| App | iron-session (HTTP-only cookies, encrypted) |
| Bridge | Bearer token (`BRIDGE_TOKEN` env) |
| WireGuard | x25519 key pairs، نفق خاص |
| DB | password auth، الشبكة الداخلية فقط (Docker network) |

---

## 🤖 الوكلاء الذكيون (6 وكلاء)

| الوكيل | المهارات | الـ LLM |
|---|---|---|
| **SAMI Orchestrator** | task-decomposer, agent-router | Claude Sonnet 4.6 |
| **Nomination Reviewer** | nomination-scorer, criteria-extractor | Claude Sonnet 4.6 |
| **Program Designer** | program-outliner, trainer-matcher | Claude Sonnet 4.6 |
| **Email Composer** | email-templater, language-stylist | Claude Sonnet 4.6 |
| **Data Analyst** (BETA) | nl-to-sql, report-generator | Claude Sonnet 4.6 |
| **Partner Relations** (قريباً) | relationship-tracker | Claude Sonnet 4.6 |

التعريف الرسمي في `src/lib/agents/registry.ts`.

كل وكيل = system prompt + skills + default model. الـ Bridge يتلقّى طلب → يشغّل الوكيل في Hermes → Hermes يستدعي الـ skills + LLM → النتيجة ترجع للويب.

---

## 📊 تدفّق المستخدم

### تسجيل موظّف جديد
```
1. الموظف يفتح qtech.help/register
2. يعبّي البيانات → POST /api/auth/register
3. الـ Backend ينشئ users (status=pending) + registration_requests
4. يرسل إشعار Telegram لمحمد ↓ مع أزرار inline
   ┌────────────────────────────┐
   │ 🆕 تسجيل جديد               │
   │ 👤 منى الشهري                │
   │ 📧 m.shahri@sdaia.gov.sa  │
   │                            │
   │  [✅ قبول]  [❌ رفض]        │
   └────────────────────────────┘
5. محمد يضغط ✅ → Telegram → /api/telegram/webhook
6. Backend يحدّث status=active + يرسل welcome email
7. الموظف يفتح /login → يطلب OTP → يدخل
```

### محادثة وكيل ذكي
```
المستخدم: /agents/email-composer
↓ يكتب: "اكتب رسالة قبول للمتدرّبين في برنامج Power BI"
↓ POST /api/agents/email-composer/chat
↓ qtech-platform → bridgeRequest('/v1/agents/chat', { agent_id, message, context })
↓ HTTPS → WireGuard tunnel → Bridge :7080
↓ Bridge → Hermes Agent → email-composer agent
↓ Hermes يستدعي skill: email-templater
↓ skill يستدعي Claude Sonnet 4.6 مع system prompt + سياق البرنامج
↓ النتيجة ترجع كـ JSON
↓ qtech-platform يحفظ في agent_messages + يعرضها في الـ chat UI
```

### تنفيذ Skill مباشر (بدون chat)
```
مثال: تصميم عرض PowerPoint من تقرير
POST /api/skills/execute
{
  "skill_id": "dga-studies-designer",
  "inputs": { "title": "...", "sections": [...] },
  "model": "claude-sonnet-4-6"
}
↓ Bridge → Hermes → DGA Studies Designer skill
↓ يولّد PPTX + يرفعه على /opt/sami/storage
↓ يرجع artifact URL
```

---

## 🗄️ قاعدة البيانات (22 جدول)

### Core
- `users`, `sessions`, `registration_requests`, `audit_log`
- `tenants`, `user_tenant_roles`

### Programs (qtech)
- `programs`, `program_formats`, `program_stages`, `program_stage_history`
- `program_comments`, `program_activity`, `program_files`
- `program_entity_invitations`, `program_partners`

### People
- `trainees`, `enrollments`, `nominees`, `nominations`
- `government_entities`, `partners`

### Communication
- `email_template_library`, `email_outbox`
- `forum_topics`, `forum_replies`

### Integration
- `monday_configs`, `monday_program_mappings`, `monday_sync_log`
- `agent_conversations`, `agent_messages`

---

## 🚀 خارطة الطريق

### Beta (الآن)
- ✅ UI شامل (8 صفحات أساسية + agent chat)
- ✅ Auth + registration + Telegram approval
- ✅ Bridge integration ready
- ⏳ Deploy على VPS

### v1.0 (بعد Beta)
- File upload + storage
- Real-time activity feed (SSE)
- Skill marketplace UI
- Mobile-optimized views

### v2.0 (لاحقاً)
- Voice interaction (Telegram + Web)
- Auto-PPTX generation للتقارير
- monday.com bidirectional sync (live)
- Multi-language (English + Arabic)
