# -*- coding: utf-8 -*-
"""Front matter + section 1 slides."""
from components import *        # noqa: F401,F403

# ----------------------------------------------------------------------------- slides: front matter
def slide_cover(D):
    s = D.cover("برنامج قدراتك  |  هيئة الحكومة الرقمية", "التدريب في الذكاء الاصطناعي", "تحديث لمعالي المحافظ",
                "محمد العُمري   |   تحديث 5 أكتوبر 2026", label="cover")
    new_notes(D, s, 1, extra_top=[
        "## ⚠ تنبيه من إعداد العرض — التصنيف",
        "وُضعت تسمية «عام - Public» في التذييل كما تشترط هوية الهيئة. المحتوى (حالة التنسيق مع الوزارة، أرقام غير مؤكدة، لا ميزانية معتمدة) قد يستوجب تصنيفًا أعلى مثل «مقيّد» قبل تداول الملف؛ تُعدّل التسمية مرة واحدة من نمط الشرائح (Slide Master) أو من متغير CLASSIFICATION في الشيفرة.",
    ])
    return s


def slide_agenda(D):
    s = D.content("هدف العرض ومحاوره", None, label="agenda", kind="agenda")
    # objective panel (right)
    px, py, pw, ph = 6.95, 1.80, R_EDGE - 6.95, 4.72
    card(s, px, py, pw, ph, fill=NAVY, radius=0.18, name="لوحة هدف العرض")
    s.text("وسم الهدف", px + 0.4, py + 0.38, pw - 0.8, 0.4,
           [para("هدف العرض", sz=16, color=GREEN, font=F_SEMI, pitch=24)])
    obj = NOTES[1]["objective"]
    s.text("نص الهدف", px + 0.4, py + 0.90, pw - 0.8, 2.3,
           [para(obj, sz=22, color=WHITE, font=F_MED, pitch=34)])
    s.line("فاصل", px + 0.4, py + 3.25, px + pw - 0.4, py + 3.25, color="5B52A0", w=1.0)
    s.text("المطلوب", px + 0.4, py + 3.42, pw - 0.8, 1.2,
           [para("المطلوب من معاليكم", sz=14, color=GREEN, font=F_SEMI, pitch=21),
            para(f"أربعة توجيهات لاستكمال العمل المشترك — الشريحة {PAGE['asks']}", sz=17, color=WHITE, pitch=26)])
    # agenda (left)
    ax, aw = L_EDGE, 5.70
    s.text("عنوان المحاور", ax, 1.80, aw, 0.45,
           [para("المحاور", sz=22, color=PURPLE, font=F_SEMI, b=True, pitch=30)])
    items = [(1, SECTIONS[1], PAGE["d1"]), (2, SECTIONS[2], PAGE["d2"]), (3, SECTIONS[3], PAGE["d3"]),
             (4, SECTIONS[4], PAGE["d4"]), ("ملاحق", ("الملاحق", "بيانات داعمة، وضبط الأرقام، وإجابات مختصرة، والمراجع"), PAGE["appendix"])]
    y = 2.40
    rh = 0.83
    for num, (nm, sub), pg in items:
        d = 0.52
        if isinstance(num, int):
            s.number_badge(num, ax + aw - d, y + 0.06, d=d, fill=GREEN, sz=18)
        else:
            s.box("رقم", ax + aw - d, y + 0.06, d, d, [], geom="ellipse", fill=NAVY_T, line=None, fit=False)
            s.icon("PiFolderOpen", NAVY, ax + aw - d + 0.13, y + 0.06 + 0.13, 0.26)
        tx_r = ax + aw - d - 0.2
        tw = text_width(nm, F_SEMI, 18)
        s.text("اسم المحور", ax + 0.9, y, tx_r - (ax + 0.9), 0.4,
               [para(nm, sz=18, color=NAVY, font=F_SEMI, pitch=26)], anchor="t")
        s.text("وصف المحور", ax + 0.9, y + 0.38, tx_r - (ax + 0.9), 0.34,
               [para(sub, sz=12, color=MUTED, pitch=17)], anchor="t", fit=False)
        # dotted leader + page number
        lead_r = tx_r - tw - 0.15
        if lead_r - (ax + 0.62) > 0.3:
            s.line("نقاط", ax + 0.62, y + 0.27, lead_r, y + 0.27, color="B8B8C8", w=1.25, dash="sysDot")
        s.text("رقم الصفحة", ax, y, 0.5, 0.4, [para(str(pg), sz=18, color=TEAL, font=F_SEMI, algn="l", pitch=26)],
               anchor="t")
        y += rh
    D.notes(s, ["## هدف العرض", NOTES[1]["objective"],
                "## بنية العرض", "ملخص تنفيذي، ثم أربعة محاور تجيب عن: أين وصلنا؟ وما النموذج المقترح؟ وكيف نصمم المسارات والشراكات والتمويل؟ وكيف ننفذ ونقيس ونقرر؟ — ثم الملاحق للرجوع عند الحاجة.",
                NOTES[1]["scope"]])
    return s


def slide_exec(D):
    s = D.content(balance("لدينا تقدم في التدريب، والمرحلة التالية تحتاج إلى نموذج يربطه باحتياج الجهات"),
                  "الرسالة التنفيذية: نبني على الجهود القائمة، ونحدد كيف تخدم هدف التبني ورفع الإنتاجية.", label="exec")
    items = [
        ("ما تم", "خمسة اجتماعات تنسيقية بحسب المسودة، ومشاركة بيانات قدراتك، وإعداد دراسة للقيادات، ومتابعة البرامج والشركاء.", "PiCheckCircle"),
        ("ما اتضح", "اعتماد حجم التدريب وتصميمه يتطلب الاتفاق على النطاق، والفئات المستهدفة، ومصادر البيانات، وآلية التنفيذ والتمويل.", "PiMagnifyingGlass"),
        ("ما نقترحه", "ثلاثة مسارات مترابطة — قيادات، ومحترفون، ووعي وتبنٍّ — تُصمم بحسب دور الموظف وأولوية الجهة.", "PiLightbulb"),
        ("طريقة البدء", "إطار مشترك للحكومة، وتنفيذ نوعي متدرج يبدأ بالجهات الخمس ذات الأولوية، مع استكمال البيانات اللازمة لتحديد مستهدفات التوسع.", "PiRocketLaunch"),
    ]
    w, g = 2.72, 0.2
    for k, (t, b, ic) in enumerate(items):
        cx = R_EDGE - w - k * (w + g)
        card(s, cx, Y_BODY, w, 3.35, name=f"بطاقة {t}")
        s.icon_badge(ic, cx + w - 0.2 - 0.62, Y_BODY + 0.22)
        s.text(f"عنوان {t}", cx + 0.2, Y_BODY + 0.98, w - 0.4, 0.4,
               [para(t, sz=18, color=PURPLE, font=F_SEMI, b=True, pitch=26)])
        s.text(f"نص {t}", cx + 0.2, Y_BODY + 1.45, w - 0.4, 1.82, [para(b, sz=14, pitch=21)])
    banner(s, L_EDGE, 5.78, CW, 0.74,
           [run("المطلوب من معاليكم:  ", sz=16, color=WHITE, font=F_SEMI),
            run(f"أربعة توجيهات لاستكمال العمل المشترك والانتقال إلى التنفيذ — الشريحة {PAGE['asks']}", sz=16, color=WHITE)],
           fill=NAVY, icon="PiFlag", icon_fg=NAVY, icon_bg=GREEN, name="المطلوب")
    D.source(s, "المرجع: مسودة تحديث 5 أكتوبر (الشرائح 3 و6 و7)؛ وثيقة المهمة الوطنية (ص 2-5).  الحالة: الاجتماعات والمساهمات من المصادر؛ النموذج وطريقة البدء توصية.")
    new_notes(D, s, 2)
    return s


# ----------------------------------------------------------------------------- section 1
def slide_roles(D):
    s = D.content(balance("قيادة الوزارة ودعم قدراتك يحتاجان إلى توزيع تنفيذي واضح للأدوار"),
                  "نقترح تثبيت المسؤولية عن التنسيق، وتصميم البرامج، والبيانات، والتنفيذ، وقياس الأثر.", label="roles")
    tag(s, 1)
    roles = [
        ("وزارة الاتصالات وتقنية المعلومات",
         "الفريق القائد للعمل المشترك، بمشاركة سعادة الوكيل الأستاذ محمد الربيعان، والأستاذة صفاء الراشد، وفريق مهارات المستقبل. يُستكمل معها الاتفاق على إطار المبادرة وتنسيق الشركاء ومستهدفاتها.",
         "PiBuildings", PURPLE),
        ("هيئة الحكومة الرقمية — قدراتك",
         "الفريق الداعم بقيادة محمد العُمري. قدم بيانات البرامج والدراسة القيادية، ويقترح الإسهام في تصميم مسارات الحكومة، خصوصًا القيادات والقدرات المرتبطة بالتحول الرقمي، ضمن نطاق متفق عليه.",
         "PiGraduationCap", TEAL),
        ("الجهات الحكومية المشاركة",
         "تحدد أولوية الاستخدام والفئات المرشحة، وتوفر بيانات الاحتياج، وتسمي مسؤولًا عن التطبيق والمتابعة داخل الجهة.",
         "PiUsersThree", PURPLE),
        ("الجهات الوطنية والشركاء",
         "تُدمج البرامج ذات الصلة، بما فيها جهود سدايا، في خطة تنسيق مشتركة تُظهر التغطية والتكامل وفرص الاستفادة من العروض القائمة.",
         "PiHandshake", TEAL),
    ]
    y = Y_BODY
    name_w = 2.75
    icon_d = 0.62
    txt_right = R_EDGE - 0.22 - icon_d - 0.2 - name_w - 0.3
    for nm, tx, ic, col in roles:
        desc = para(tx, sz=14, pitch=21)
        dw = txt_right - (L_EDGE + 0.28)
        h = max(0.92, desc.height(dw) + 0.24)
        card(s, L_EDGE, y, CW, h, name=f"بطاقة {nm}")
        s.icon_badge(ic, R_EDGE - 0.22 - icon_d, y + (h - icon_d) / 2, d=icon_d,
                     bg=PURPLE_T if col == PURPLE else TEAL_T, fg=col)
        s.text(f"الجهة {nm}", R_EDGE - 0.22 - icon_d - 0.2 - name_w, y, name_w, h,
               [para(nm, sz=16, color=PURPLE if col == PURPLE else TEAL, font=F_SEMI, b=False, pitch=23)], anchor="ctr")
        s.text(f"دور {nm}", L_EDGE + 0.28, y, dw, h, [desc], anchor="ctr")
        y += h + 0.09
    if y - 0.09 > Y_BODY_END:
        s.warn(f"roles rows end at {y-0.09:.2f}")
    D.source(s, "المرجع: مسودة التحديث (الشرائح 3 و6 و7)؛ وثيقة المهمة الوطنية (ص 2 و3 و5).  الحالة: قيادة الوزارة ودعم قدراتك كما وردا؛ التفصيل التنفيذي والتنسيق مع سدايا مقترح.")
    new_notes(D, s, 3)
    return s


def slide_meetings(D):
    s = D.content("خمسة اجتماعات نقلت النقاش\nمن عرض البرامج إلى تحديد احتياج الحكومة",
                  "العدد وارد في مسودة التحديث؛ وفيما يلي خلاصة الموضوعات كما تصفها المسودة.", label="meetings")
    tag(s, 1)
    # stat card (right-most)
    sw = 1.95
    sx = R_EDGE - sw
    card(s, sx, Y_BODY, sw, 4.3, fill=NAVY, radius=0.16, name="عدد الاجتماعات")
    s.text("رقم 5", sx, Y_BODY + 0.5, sw, 1.4, [para("5", sz=80, color=WHITE, font=F_SEMI, b=True, algn="ctr", pitch=96)],
           anchor="ctr")
    s.text("وصف العدد", sx + 0.12, Y_BODY + 1.9, sw - 0.24, 1.3,
           [para("اجتماعات تنسيقية", sz=18, color=WHITE, font=F_SEMI, algn="ctr", pitch=26),
            para("بحسب مسودة التحديث", sz=13, color="D5D3E8", algn="ctr", pitch=19)])
    s.chip("العدد من المسودة", sx + 0.22, Y_BODY + 3.5, sw - 0.44, h=0.38, fill=GREEN, color=NAVY, sz=12)
    stages = [
        ("الاجتماعات الأولى", PURPLE,
         "جهود قدراتك، والبرامج المنفذة والمخططة في 2026، والبيانات المتاحة عن القيادات والموظفين والتدريب.",
         "مشاركة حصر البرامج والمستفيدين والمدخلات المتاحة لدى قدراتك."),
        ("الاجتماعات اللاحقة", TEAL,
         "حجم الشرائح المستهدفة، وبرامج القيادات، وبناء القدرات المتخصصة، والبيانات اللازمة لتقدير حجم التدريب.",
         "إعداد الدراسة المعيارية للقيادات وتوضيح حدود البيانات المتاحة لدى البرنامج."),
        ("الاجتماع الخامس", NAVY,
         "مصادر أعداد الموظفين بمشاركة لجنة رفع الإنتاجية، والاستفادة من البيانات الحالية في تحديد النطاق والفئات.",
         "التوجه إلى التنسيق المباشر مع الجهات الحكومية الخمس ذات الأولوية لفهم احتياجاتها وبناء نطاق التنفيذ."),
    ]
    gap = 0.18
    cw = (CW - sw - gap * 3) / 3
    for k, (nm, col, topics, result) in enumerate(stages):
        cx = sx - gap - (k + 1) * cw - k * gap
        chevron(s, cx, Y_BODY, cw, 0.66, nm, col, sz=16, name=f"مرحلة {nm}")
        by = Y_BODY + 0.78
        blocks = [("أبرز ما تناولته", topics), ("ما ترتب عليها", result)]
        for j, (lab, tx) in enumerate(blocks):
            h = 1.70
            card(s, cx, by, cw, h, name=f"{lab} {nm}")
            labeled(s, f"{lab} نص", cx + 0.18, by + 0.12, cw - 0.36, lab, tx, label_color=col if col != NAVY else PURPLE)
            by += h + 0.06
    D.source(s, "المرجع: مسودة تحديث 5 أكتوبر (الشريحة 3).  الحالة: العدد ومراحل النقاش من المسودة؛ التواريخ والمخرجات لكل اجتماع تُستكمل من المحاضر (الملحق 2).")
    new_notes(D, s, 4)
    return s


def slide_delivered(D):
    s = D.content("استمر التدريب بالتوازي مع تجهيز المدخلات اللازمة للمبادرة",
                  "مساهمتنا شملت التنفيذ، وتجهيز المعلومات، وتطوير خيارات البرامج القادمة.", label="delivered")
    tag(s, 1)
    tiles = [
        ("627", "مستفيدًا", "برنامج قدراتك في الذكاء الاصطناعي لعام 2026 حتى الآن: 10 برامج وورشة عمل توعوية (حضوري وأونلاين).", PURPLE),
        ("770", "مستفيدًا", "شركاء رواد السحابة: تدريب في 23 برنامجًا.", TEAL),
        ("272", "موظفًا حكوميًا", "شركاء ربطنا بهم الزملاء في مكتب رفع الإنتاجية: تنفيذ 8 برامج وورش عمل.", PURPLE),
    ]
    g = 0.2
    tw = (CW - 2 * g) / 3
    th = 1.84
    for k, (num, unit, desc, col) in enumerate(tiles):
        tx = R_EDGE - tw - k * (tw + g)
        card(s, tx, Y_BODY, tw, th, fill=PURPLE_T if col == PURPLE else TEAL_T, radius=0.16, name=f"مؤشر {num}")
        s.text("الرقم", tx + 0.25, Y_BODY + 0.08, tw - 0.5, 0.86,
               [para([run(num, sz=46, color=col, font=F_SEMI, b=True), run("  " + unit, sz=17, color=NAVY, font=F_SEMI)],
                     pitch=62)], anchor="ctr")
        s.text("وصف الرقم", tx + 0.25, Y_BODY + 0.98, tw - 0.5, th - 1.02, [para(desc, sz=14, pitch=20)])
    kp = [
        ("12 من 32", "برنامجًا قياديًا أبرزتها الدراسة المعيارية، مع نموذج مقترح لأربعة مستويات قيادية.", PURPLE),
        ("52 جهة", "جرى التواصل معها لحصر التدريب في الذكاء الاصطناعي؛ ولم ترد البيانات بعد.", TEAL),
        ("350", "سجل مسؤولي تقنية المعلومات ضمن بيانات قدراتك، وليس حصرًا للموظفين.", PURPLE),
        ("7 أكتوبر", "أول ورشة توعوية افتراضية لمسار FDE — مخططة وليست منفذة بعد.", TEAL),
    ]
    g2 = 0.18
    cw = (CW - 3 * g2) / 4
    y2 = Y_BODY + th + 0.12
    ch = 1.8
    for k, (num, lab, col) in enumerate(kp):
        cx = R_EDGE - cw - k * (cw + g2)
        card(s, cx, y2, cw, ch, name=f"رقم {num}")
        s.text("الرقم", cx + 0.2, y2 + 0.1, cw - 0.4, 0.55,
               [para(num, sz=28, color=col, font=F_SEMI, b=True, pitch=38)], anchor="ctr")
        s.text("وصف", cx + 0.2, y2 + 0.68, cw - 0.4, ch - 0.72, [para(lab, sz=13, pitch=19)])
    by = y2 + ch + 0.12
    banner(s, L_EDGE, by, CW, Y_BODY_END - by,
           [run("حصر الجهود القائمة:  ", sz=15, color=NAVY, font=F_SEMI),
            run("مشاركة البرامج المنفذة والمخططة وأعداد المستفيدين وعروض الشركاء.", sz=15)],
           fill=TEAL_T, icon="PiListChecks", icon_fg=TEAL, icon_bg=WHITE, name="حصر الجهود")
    D.source(s, "المرجع: مسودة التحديث (الشرائح 4 و6 و7)؛ الدراسة المعيارية (ص 3 و6 و8).  الحالة: أرقام المسودة بتاريخ قطع يُؤكَّد؛ لا تُجمع الأرقام الثلاثة؛ الورشة مخططة.")
    new_notes(D, s, 5)
    return s




def divider1(D):
    s = D.divider(1, SECTIONS[1][0], SECTIONS[1][1])
    D.notes(s, ["## القسم الأول: " + SECTIONS[1][0], SECTIONS[1][1]])
    return s
