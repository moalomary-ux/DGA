# -*- coding: utf-8 -*-
"""Section 3 — تصميم المسارات والشراكات والتمويل (original slides 11-15)."""
from components import *        # noqa: F401,F403


def divider3(D):
    s = D.divider(3, SECTIONS[3][0], SECTIONS[3][1])
    D.notes(s, ["## القسم الثالث: " + SECTIONS[3][0], SECTIONS[3][1]])
    return s


# ----------------------------------------------------------------------------- S11
def slide_leaders(D):
    s = D.content("برامج القيادات تُصمم بحسب نطاق القرار والمسؤولية",
                  "توصي الدراسة بأربعة مستويات؛ ترتفع الحاجة إلى التخصيص كلما اتسع نطاق القرار وحساسية الملفات.",
                  label="leaders")
    tag(s, 3)
    levels = [
        ("الوزراء", PURPLE, WHITE,
         "الاختيارات الاستراتيجية، والأثر على القطاع، والأولويات والحوكمة والمسؤولية عن القرارات.",
         "جلسات محلية مخصصة ترتبط بملفات فعلية؛ ومخرجها أولويات وقرارات وخطة متابعة."),
        ("نواب ومساعدو الوزراء وأصحاب المعالي والمحافظون", "9D65D6", WHITE,
         "إدارة التبني داخل المؤسسة، والاستثمار، وتوجيه البرامج والأطراف التابعة.",
         "مجموعات منتقاة ومغلقة بمحتوى محلي وخبراء متخصصين؛ ومخرجها خارطة تبنٍّ ومسؤوليات تنفيذية."),
        ("وكلاء الوزارات ونواب المحافظين", "BD98E4", NAVY,
         "تحويل التوجه إلى برامج، وتحديد حالات الاستخدام، وتنسيق التنفيذ وإدارة التغيير.",
         "برامج قائمة مع تخصيص على حالات الجهة؛ ومخرجها خطة تطبيق بمؤشرات وملاك واضحين."),
        ("مساعدو الوكلاء والرؤساء التنفيذيون ومن يعادلهم", "DECBF1", NAVY,
         "الإشراف على التطبيق، وجاهزية الفرق، وجودة العمليات والمتابعة.",
         "تعلم تطبيقي ومشروع مرتبط بالعمل؛ ومخرجه تحسين إجراء أو تشغيل حالة استخدام."),
    ]
    rows = [["المستوى المقترح", "التركيز", "طريقة التقديم والمخرج"]]
    for k, (nm, fill, fg, focus, deliver) in enumerate(levels):
        rows.append([
            dict(paras=[para(f"المستوى {k + 1}", sz=12, color=fg, font=F_MED, pitch=16),
                        para(nm, sz=15, color=fg, font=F_SEMI, pitch=21)], fill=fill),
            [para(focus, sz=14, pitch=20)],
            [para(deliver, sz=14, pitch=20)],
        ])
    min_h = (Y_BODY_END - Y_BODY - 0.48) / 4
    s.table("مستويات برامج القيادات", L_EDGE, Y_BODY, [3.1, 4.1, 4.3], rows, min_h=min_h, hdr_h=0.48,
            max_bottom=Y_BODY_END + 0.02, zebra=False, margins=(0.16, 0.06, 0.16, 0.06))
    D.source(s, "المرجع: الدراسة المعيارية (ص 8-13 و21-26).  الحالة: المستويات وطريقة التقديم توصية مبنية على الدراسة؛ التكلفة والميزانية غير معتمدة. تدرج اللون = مستوى التخصيص.")
    new_notes(D, s, 11)
    return s


# ----------------------------------------------------------------------------- S12
def slide_professionals(D):
    s = D.content("مسار المحترفين يجمع القدرة التقنية وفهم العمل الحكومي",
                  "يُبنى التخصص حول حالة استخدام في الجهة، بمشاركة من ينفذ الحل ومن يملك العملية.", label="professionals")
    tag(s, 3)
    g = 0.2
    cw = (CW - g) / 2
    b1h = 1.62
    cards = [
        ("المتخصصون التقنيون", "PiCode", TEAL,
         "تطوير التطبيقات، وتجهيز البيانات، وتكامل الأنظمة، والاختبار والتقييم والتشغيل، بحسب احتياج الجهة."),
        ("خبراء المجالات ومالكو العمليات", "PiIdentificationBadge", PURPLE,
         "تحديد المهام المناسبة، ومعايير الجودة، وحدود التفويض، وطريقة دمج الحل في الإجراء ومتابعة نتيجته."),
    ]
    for k, (t, ic, col, b) in enumerate(cards):
        x = R_EDGE - cw - k * (cw + g)
        card(s, x, Y_BODY, cw, b1h, name=f"فئة {t}")
        d = 0.64
        s.icon_badge(ic, x + cw - 0.25 - d, Y_BODY + 0.18, d=d, bg=TEAL_T if col == TEAL else PURPLE_T, fg=col)
        s.text(f"عنوان {t}", x + 0.25, Y_BODY + 0.18, cw - 0.25 - d - 0.2 - 0.25, d,
               [para(t, sz=19, color=col, font=F_SEMI, pitch=27)], anchor="ctr")
        s.text(f"نص {t}", x + 0.25, Y_BODY + 0.9, cw - 0.5, b1h - 0.94, [para(b, sz=14, pitch=20)])
    # "+" joint between the two audiences
    jx = R_EDGE - cw - g / 2
    s.box("يتعلمان معًا", jx - 0.21, Y_BODY + b1h / 2 - 0.21, 0.42, 0.42,
          [para("+", sz=22, color=NAVY, font=F_SEMI, b=True, algn="ctr", pitch=26)], geom="ellipse", fill=WHITE,
          line=LINE, line_w=1.0, anchor="ctr", ins=(0, 0, 0, 0), fit=False)
    # band 2: how they learn
    y2 = Y_BODY + b1h + 0.12
    h2 = 0.9
    lab_w = 1.75
    s.text("طريقة التعلم", R_EDGE - lab_w, y2, lab_w, h2,
           [para("طريقة التعلم", sz=17, color=PURPLE, font=F_SEMI, pitch=24),
            para("معًا على حالة استخدام", sz=12, color=MUTED, pitch=17)], anchor="ctr")
    steps = ["تدريب عملي", "تطبيق موجّه على حالة استخدام", "إرشاد أثناء التجربة", "تقييم للقدرة على التنفيذ"]
    cols = [TEAL, PURPLE, TEAL, PURPLE]
    area_r = R_EDGE - lab_w - 0.1
    sw = (area_r - L_EDGE - 3 * 0.08) / 4
    for k, t in enumerate(steps):
        x = area_r - sw - k * (sw + 0.08)
        chevron(s, x, y2, sw, h2, t, cols[k], sz=14, name=f"خطوة {k + 1}")
    # band 3: FDE
    y3 = y2 + h2 + 0.12
    h3 = Y_BODY_END - y3
    card(s, L_EDGE, y3, CW, h3, fill=NAVY, radius=0.16, name="مسار FDE")
    half = (CW - 0.6) / 2
    rx = R_EDGE - 0.3 - half
    s.text("عنوان FDE", rx, y3 + 0.14, half, 0.36, [para("مسار FDE المقترح", sz=18, color=WHITE, font=F_SEMI, pitch=25)])
    s.text("نص FDE", rx, y3 + 0.52, half, h3 - 0.6,
           [para("تطوير قدرة فرق تعمل بالقرب من تحديات الجهة، وتربط فهم العملية بالبناء التقني والتطبيق والتحسين.",
                 sz=14, color=WHITE, pitch=20)])
    s.line("فاصل", L_EDGE + 0.3 + half + 0.0, y3 + 0.2, L_EDGE + 0.3 + half + 0.0, y3 + h3 - 0.2, color="5B52A0", w=1)
    lx = L_EDGE + 0.3
    s.text("عنوان الخطوة", lx + 1.95, y3 + 0.14, half - 0.3 - 1.95, 0.36,
           [para("الخطوة الحالية", sz=16, color=GREEN, font=F_SEMI, pitch=24)])
    s.chip("مخطط — لم يُنفَّذ", lx, y3 + 0.16, 1.7, h=0.32, fill=GREEN, color=NAVY, sz=12)
    s.text("نص الخطوة", lx, y3 + 0.54, half - 0.3, h3 - 0.6,
           [para("تواصل مع شركاء وخبراء؛ ورشة تعريفية مخطط لها في 7 أكتوبر؛ يليها تحديد نموذج المسار والفئات والشركاء ومتطلبات التطبيق.",
                 sz=14, color=WHITE, pitch=20)])
    D.source(s, "المرجع: مسودة التحديث (الشريحة 7)؛ وثيقة المهمة الوطنية (ص 4)؛ Palantir (تعريف FDE).  الحالة: التواصل والورشة مخططان؛ نموذج المحترفين وFDE مقترح.")
    new_notes(D, s, 12)
    return s


# ----------------------------------------------------------------------------- S13
def slide_awareness(D):
    s = D.content("الوعي والتبني يحتاجان إلى تعلم مستمر ومساندة داخل بيئة العمل",
                  "تغير الأدوات سريع؛ لذلك نصمم تدريبًا يبني قدرة الموظف على التعلم والتطبيق والمراجعة.", label="awareness")
    tag(s, 3)
    steps = [
        ("أساس مشترك", "PiBrain", "فهم قدرات الذكاء الاصطناعي وحدوده، وصياغة الطلب، والتحقق من النتائج، والتعامل مع البيانات وفق ضوابط الجهة."),
        ("تطبيق بحسب المهمة", "PiNotePencil", "أمثلة وتمارين مرتبطة بالعمل الفعلي، مثل إعداد مسودة، أو تحليل مادة، أو تلخيص مستند، باستخدام الأدوات المتاحة والمعتمدة."),
        ("تحديثات قصيرة", "PiArrowsClockwise", "محتوى يُراجع دوريًا عندما تتغير الأدوات أو الممارسات ذات الصلة بالعمل، دون إعادة البرنامج كاملًا في كل مرة."),
        ("إدارة تغيير", "PiChatsCircle", "توضيح فائدة الاستخدام للموظف، وإتاحة دعم تطبيقي، وتسمية أشخاص في الجهة يساعدون زملاءهم، ومتابعة ما يعيق الاستفادة."),
    ]
    gap = 0.34
    cw = (CW - 3 * gap) / 4
    ch = 3.1
    for k, (t, ic, b) in enumerate(steps):
        x = R_EDGE - cw - k * (cw + gap)
        card(s, x, Y_BODY, cw, ch, name=f"عنصر {t}")
        s.icon_badge(ic, x + cw - 0.2 - 0.62, Y_BODY + 0.2, d=0.62, bg=TEAL_T, fg=TEAL)
        s.number_badge(k + 1, x + 0.2, Y_BODY + 0.28, d=0.42, fill=GREEN, sz=15)
        s.text(f"عنوان {t}", x + 0.2, Y_BODY + 0.95, cw - 0.4, 0.4, [para(t, sz=16, color=PURPLE, font=F_SEMI, pitch=24)])
        s.text(f"نص {t}", x + 0.2, Y_BODY + 1.4, cw - 0.4, ch - 1.45, [para(b, sz=14, pitch=20)])
        if k < 3:
            ax = x - gap
            s.oval("سهم", ax + 0.02, Y_BODY + 0.34, gap - 0.04, fill=TEAL_T)
            s.icon("PiArrowLeft", TEAL, ax + 0.07, Y_BODY + 0.39, gap - 0.14)
    # continuous loop: line under the cards with arrow back to the start
    ly = Y_BODY + ch + 0.17
    x_start = R_EDGE - cw / 2
    x_end = R_EDGE - 3 * (cw + gap) - cw / 2
    s.line("عودة", x_end, Y_BODY + ch, x_end, ly, color=TEAL, w=1.5)
    s.line("عودة", x_end, ly, x_start, ly, color=TEAL, w=1.5)
    s.line("عودة", x_start, ly, x_start, Y_BODY + ch + 0.01, color=TEAL, w=1.5, head="triangle")
    s.chip("تعلم مستمر", (x_start + x_end) / 2 - 0.8, ly - 0.16, 1.6, h=0.32, fill=WHITE, color=TEAL, sz=12)
    by = ly + 0.28
    banner(s, L_EDGE, by, CW, Y_BODY_END - by,
           [run("مقياس النجاح:  ", sz=15, color=NAVY, font=F_SEMI),
            run("أن يتمكن الموظف من استخدام الأداة في مهمة مناسبة وتحسين نتيجتها، مع الحفاظ على المراجعة والمسؤولية المهنية.", sz=15, color=NAVY)],
           fill=GREEN_T, icon="PiSealCheck", icon_fg=GREEN, icon_bg=WHITE, sz=15, pitch=22, name="مقياس النجاح")
    D.source(s, "المرجع: وثيقة المهمة الوطنية (ص 3 و4)؛ OECD (2026).  الحالة: تصور مقترح من قدراتك؛ أمثلة المهام تُختار بحسب سياسات وأدوات كل جهة.")
    new_notes(D, s, 13)
    return s


# ----------------------------------------------------------------------------- S14
def slide_partners(D):
    s = D.content("نربط عروض الشركاء باحتياج المسارات ونوحّد متابعة المقاعد",
                  "نقارن العروض بحسب القدرة والمخرج، ونعرض المستهدف والمقدم والمنفذ في خانات مستقلة.", label="partners")
    tag(s, 3)
    stages = [
        ("مستهدف تخطيطي", "1,600", "مستفيد على سنتين، منها 800 مستهدف سنوي في 2026", PURPLE, True),
        ("عرض مقدَّم", "165", "مقعدًا في البرامج المقدمة", TEAL, True),
        ("التزام مثبت", "—", "لا مستندات التزام في المرفقات", MUTED, False),
        ("مقاعد مجدولة", "—", "يُستكمل من ملف المتابعة", MUTED, False),
        ("تدريب منفذ", "115", "مستفيدًا منفذًا ضمن نطاق ملف الشركاء", NAVY, True),
    ]
    gap = 0.1
    sw = (CW - 4 * gap) / 5
    ch_h, card_h = 0.58, 1.5
    for k, (nm, num, cap, col, known) in enumerate(stages):
        x = R_EDGE - sw - k * (sw + gap)
        if known:
            chevron(s, x, Y_BODY, sw, ch_h, nm, col, sz=14, name=f"حالة {nm}")
            card(s, x, Y_BODY + ch_h + 0.08, sw, card_h, fill=CARD, name=f"رقم {nm}")
            nc = col
        else:
            s.box(f"حالة {nm}", x, Y_BODY, sw, ch_h, [para(nm, sz=14, color=MUTED, font=F_SEMI, algn="ctr", pitch=20)],
                  geom="homePlate", fill=WHITE, line="9A9AA8", line_w=1.25, dash="dash", anchor="ctr",
                  ins=(0.38, 0, 0.15, 0), flipH=True, fit=False, adj={"adj": 32000})
            s.box(f"رقم {nm}", x, Y_BODY + ch_h + 0.08, sw, card_h, [], geom="roundRect", radius=0.14, fill=WHITE,
                  line="9A9AA8", line_w=1.25, dash="dash", fit=False)
            nc = "9A9AA8"
        s.text("الرقم", x + 0.12, Y_BODY + ch_h + 0.12, sw - 0.24, 0.62,
               [para(num, sz=32, color=nc, font=F_SEMI, b=True, algn="ctr", pitch=44)], anchor="ctr")
        s.text("وصف", x + 0.14, Y_BODY + ch_h + 0.78, sw - 0.28, card_h - 0.74,
               [para(cap, sz=13, color=BODY if known else MUTED, algn="ctr", pitch=18)])
    yb = Y_BODY + ch_h + 0.08 + card_h + 0.12
    banner(s, L_EDGE, yb, CW, 0.62,
           [run("نطاق مختلف:  ", sz=14, color=NAVY, font=F_SEMI),
            run(f"هذه الأعداد لها نطاق متابعة مختلف عن أرقام قدراتك الواردة في الشريحة {PAGE['delivered']}؛ ويُطابق النطاق وتاريخ القطع قبل استخدامها في مقارنة أو تجميع.", sz=14, color=NAVY)],
           fill=PURPLE_T, icon="PiWarning", icon_fg=PURPLE, icon_bg=WHITE, sz=14, pitch=20, name="تنبيه النطاق")
    y3 = yb + 0.62 + 0.12
    h3 = Y_BODY_END - y3
    lw = 7.3
    card(s, R_EDGE - lw, y3, lw, h3, name="الوصف الموحد")
    s.text("وسم الوصف الموحد", R_EDGE - lw + 0.2, y3 + 0.08, lw - 0.4, 0.3,
           [para("وصف موحد يُطلب من كل مزود", sz=14, color=PURPLE, font=F_SEMI, pitch=20)])
    fields = ["الفئة", "الجدارات", "المستوى", "ساعات التعلم", "التطبيق العملي", "أسلوب التقييم", "الإرشاد بعد التدريب", "المخرج المتوقع"]
    cwid = (lw - 0.4 - 3 * 0.1) / 4
    for k, t in enumerate(fields):
        r, c = divmod(k, 4)
        cx = R_EDGE - 0.2 - cwid - c * (cwid + 0.1)
        s.chip(t, cx, y3 + 0.45 + r * 0.42, cwid, h=0.34, fill=WHITE, color=TEAL, sz=12)
    rw = CW - lw - 0.2
    card(s, L_EDGE, y3, rw, h3, fill=TEAL_T, name="الاستفادة")
    s.text("نص الاستفادة", L_EDGE + 0.2, y3, rw - 0.4, h3,
           [para("تُستفاد مساهمات الشركاء في البرامج الملائمة، مع تخصيص ما يحتاج محتوى حكوميًا أو تطبيقًا وإرشادًا إضافيًا.",
                 sz=14, color=NAVY, pitch=20)], anchor="ctr")
    D.source(s, "المرجع: متابعة الشركاء (الشاملة، الشرائح 1-6؛ والمجمعة)؛ مسودة التحديث (الشريحة 4).  الحالة: أرقام الملف وقت إعداده؛ لا تثبت المرفقات أن 800 كلها التزامات مؤكدة.")
    new_notes(D, s, 14)
    return s


# ----------------------------------------------------------------------------- S15
def slide_funding(D):
    s = D.content("نوصي بمزيج تمويل يستفيد من المساهمات ويمول الاحتياج المخصص",
                  "يُحدد التمويل بحسب نوع البرنامج واحتياجه إلى التصميم والتطبيق والمتابعة.", label="funding")
    tag(s, 3)
    cols = [
        ("مساهمات الشركاء", "PiHandshake", TEAL,
         "المحتوى التأسيسي والبرامج القائمة التي تطابق الفئات والجدارات المطلوبة.",
         "تثبيت المقاعد والمواعيد والجودة والتغطية، وتحديد حدود المحتوى والإرشاد المتاح."),
        ("تمويل برامج مخصصة", "PiCoins", PURPLE,
         "القيادات العليا، والحالات الحكومية المحلية، والتطبيقات المتخصصة التي تحتاج تصميمًا وإرشادًا.",
         "تسعير التصميم والتقديم والإرشاد والمتابعة وقياس الأثر على نطاق معلوم."),
        ("المزيج المقترح", "PiPuzzlePiece", NAVY,
         "الاستفادة من العروض الملائمة، واستكمالها بتمويل موجه للبرامج والحالات التي تتطلب تخصيصًا.",
         "حزمة برامج محددة، وخيارات تكلفة وتمويل، ثم قرار بالأولوية والتنفيذ."),
    ]
    op_w = 0.62
    cw = (CW - 2 * op_w) / 3
    ch = 3.42
    for k, (t, ic, col, when, need) in enumerate(cols):
        x = R_EDGE - cw - k * (cw + op_w)
        last = (k == 2)
        card(s, x, Y_BODY, cw, ch, fill=PURPLE_T if last else CARD, line=PURPLE if last else None, name=f"خيار {t}")
        s.icon_badge(ic, x + cw - 0.22 - 0.6, Y_BODY + 0.2, d=0.6, bg=WHITE, fg=col if col != NAVY else PURPLE)
        s.text(f"عنوان {t}", x + 0.22, Y_BODY + 0.14, cw - 0.22 - 0.6 - 0.15 - 0.22, 0.72,
               [para(t, sz=18, color=col if col != NAVY else PURPLE, font=F_SEMI, pitch=25)], anchor="ctr")
        yy = Y_BODY + 0.95
        h1 = labeled(s, f"متى {t}", x + 0.22, yy, cw - 0.44, "متى يخدم المبادرة", when, label_color=TEAL, sz=14)
        yy += h1 + 0.14
        labeled(s, f"ما يلزم {t}", x + 0.22, yy, cw - 0.44, "ما يلزم لتقديره", need, label_color=TEAL, sz=14)
        if k < 2:
            ox = x - op_w + (op_w - 0.46) / 2
            s.box("عامل", ox, Y_BODY + 0.27, 0.46, 0.46,
                  [para("+" if k == 0 else "=", sz=22, color=WHITE, font=F_SEMI, b=True, algn="ctr", pitch=26)],
                  geom="ellipse", fill=NAVY, anchor="ctr", ins=(0, 0, 0, 0), fit=False)
    by = Y_BODY + ch + 0.12
    banner(s, L_EDGE, by, CW, Y_BODY_END - by,
           [run("لم يتضح حتى الآن في المدخلات وجود ميزانية معتمدة للبرامج المخصصة. ", sz=16, color=WHITE, font=F_SEMI),
            run("نوصي بتطوير نطاقها وخياراتها المالية ورفعها للقرار.", sz=16, color=WHITE)],
           fill=NAVY, icon="PiWarning", icon_fg=NAVY, icon_bg=GREEN, sz=16, pitch=24, name="لا ميزانية معتمدة")
    D.source(s, "المرجع: الدراسة المعيارية (ص 6 و21-26)؛ وثيقة المهمة الوطنية (ص 5).  الحالة: مقترح تمويل؛ الميزانية والتكاليف النهائية غير محسومة؛ أسعار الدراسة مرجع أولي.")
    new_notes(D, s, 15)
    return s
