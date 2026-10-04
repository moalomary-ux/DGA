# -*- coding: utf-8 -*-
"""Section 2 — النموذج المقترح (original slides 6-10)."""
from components import *        # noqa: F401,F403


def divider2(D):
    s = D.divider(2, SECTIONS[2][0], SECTIONS[2][1])
    D.notes(s, ["## القسم الثاني: " + SECTIONS[2][0], SECTIONS[2][1]])
    return s


# ----------------------------------------------------------------------------- S6
def slide_choices(D):
    s = D.content(balance("الانتقال إلى التنفيذ يتطلب حسم أربعة خيارات في تصميم المسار"),
                  "نحول موضوعات النقاش إلى قرارات يمكن البناء عليها.", label="choices")
    tag(s, 2)
    items = [
        ("نطاق المسؤولية", "توزيع مكتوب للأدوار بين قيادة المبادرة، ودعم المسار الحكومي، والجهات المنفذة، والجهات المالكة للبيانات.", "PiScales", PURPLE),
        ("نطاق التغطية", "إطار مشترك يمكن تطبيقه على الحكومة، مع ترتيب التنفيذ بحسب الأولوية والأثر والجاهزية.", "PiMapTrifold", TEAL),
        ("تقسيم المستفيدين", "ثلاثة مسارات رئيسية، مع تفصيل المستوى الوظيفي والتخصص والدور داخل كل مسار.", "PiChartPieSlice", PURPLE),
        ("البيانات والتمويل", "استكمال التقدير الوطني بالتوازي مع تشخيص الجهات الخمس، وتسعير البرامج المخصصة قبل اعتماد التنفيذ الممول.", "PiDatabase", TEAL),
    ]
    g = 0.2
    cw = (CW - g) / 2
    ch = (Y_BODY_END - Y_BODY - g) / 2
    for k, (t, b, ic, col) in enumerate(items):
        r, c = divmod(k, 2)
        x = R_EDGE - cw - c * (cw + g)
        y = Y_BODY + r * (ch + g)
        card(s, x, y, cw, ch, name=f"خيار {t}")
        d = 0.66
        s.icon_badge(ic, x + cw - 0.28 - d, y + 0.2, d=d, bg=PURPLE_T if col == PURPLE else TEAL_T, fg=col)
        s.text(f"عنوان {t}", x + 0.28, y + 0.2, cw - 0.28 - d - 0.2 - 0.28, d,
               [para(t, sz=21, color=col, font=F_SEMI, b=False, pitch=30)], anchor="ctr")
        s.text(f"نص {t}", x + 0.28, y + 1.0, cw - 0.56, ch - 1.06, [para(b, sz=15, pitch=22)])
    D.source(s, "المرجع: مسودة التحديث (الشرائح 3 و6 و7)؛ وثيقة المهمة الوطنية (ص 3-5).  الحالة: تحليل وتوصية من قدراتك مبنيان على موضوعات النقاش، وليسا اتفاقًا معتمدًا.")
    new_notes(D, s, 6)
    return s


# ----------------------------------------------------------------------------- S7
def slide_framework(D):
    s = D.content(balance("نوصي بإطار للحكومة وتنفيذ متدرج يبدأ بالجهات ذات الأولوية"),
                  "نطاق التغطية يحدد من نخدم، وأولوية التنفيذ تحدد من نبدأ به.", label="framework")
    tag(s, 2)
    # ---- right: layered diagram (platform vs first wave)
    dx, dw = 6.95, R_EDGE - 6.95
    top_h, base_y = 1.62, Y_BODY + 1.62 + 0.2
    base_h = Y_BODY_END - base_y
    cx = dx + dw / 2
    tw = 3.9
    card(s, cx - tw / 2, Y_BODY, tw, top_h, fill=PURPLE, radius=0.18, name="الموجة الأولى")
    s.text("وسم الموجة الأولى", cx - tw / 2 + 0.25, Y_BODY + 0.14, tw - 0.5, 0.3,
           [para("في البداية", sz=13, color="E6D8F7", font=F_SEMI, algn="ctr", pitch=19)])
    s.text("عنوان الموجة الأولى", cx - tw / 2 + 0.25, Y_BODY + 0.42, tw - 0.5, 0.5,
           [para("5 جهات ذات أولوية", sz=22, color=WHITE, font=F_SEMI, b=True, algn="ctr", pitch=32)], anchor="ctr")
    s.text("وصف الموجة الأولى", cx - tw / 2 + 0.22, Y_BODY + 0.93, tw - 0.44, 0.65,
           [para("تشخيص الاحتياج وبناء برامج نوعية — بعد تأكيد أسمائها", sz=14, color=WHITE, algn="ctr", pitch=20)])
    # small down arrow between layers
    s._append(sp_xml(s.nid(), "سهم", cx - 0.16, Y_BODY + top_h + 0.02, 0.32, 0.17, None, geom="triangle",
                     fill=PURPLE, line=None, flipH=False).replace('<a:xfrm>', '<a:xfrm flipV="1">'))
    card(s, dx, base_y, dw, base_h, fill=TEAL_T, line=TEAL, radius=0.2, name="إطار الحكومة")
    s.chip("على مستوى الحكومة", dx + dw - 0.25 - 1.9, base_y + 0.2, 1.9, h=0.34, fill=TEAL, color=WHITE, sz=12)
    s.text("عنوان الإطار", dx + 0.25, base_y + 0.58, dw - 0.5, 0.45,
           [para("إطار مشترك", sz=22, color=PURPLE, font=F_SEMI, b=True, pitch=31)], anchor="ctr")
    pills = ["القدرات", "التصنيف", "مؤشرات القياس", "محتوى تأسيسي"]
    pw_, ph_ = (dw - 0.5 - 0.15) / 2, 0.4
    for k, t in enumerate(pills):
        r, c = divmod(k, 2)
        px = dx + dw - 0.25 - pw_ - c * (pw_ + 0.15)
        py = base_y + 1.1 + r * (ph_ + 0.1)
        s.box("عنصر الإطار", px, py, pw_, ph_, [para(t, sz=14, color=TEAL, font=F_SEMI, algn="ctr", pitch=20)],
              geom="roundRect", radius=0.1, fill=WHITE, anchor="ctr", ins=(0.05, 0, 0.05, 0), fit=False)
    s.text("تذييل الإطار", dx + 0.25, base_y + 2.02, dw - 0.5, base_h - 2.06,
           [para("تستفيد منه الجهات وفق جاهزيتها", sz=14, color=NAVY, algn="r", pitch=20)], anchor="t")
    # ---- left: criteria + two notes
    lw = dx - 0.2 - L_EDGE
    crit_h = 2.12
    card(s, L_EDGE, Y_BODY, lw, crit_h, name="معايير الترتيب")
    s.text("عنوان المعايير", L_EDGE + 0.25, Y_BODY + 0.14, lw - 0.5, 0.36,
           [para("معايير ترتيب التنفيذ", sz=17, color=PURPLE, font=F_SEMI, pitch=24)])
    crit = ["قيمة الاستخدام للخدمة أو العملية", "حجم الحاجة للمهارات", "جاهزية البيانات والأدوات",
            "التزام قيادة الجهة بالتطبيق"]
    for k, t in enumerate(crit):
        yy = Y_BODY + 0.58 + k * 0.38
        s.number_badge(k + 1, R_EDGE - R_EDGE + L_EDGE + lw - 0.25 - 0.3, yy + 0.02, d=0.3, fill=TEAL, sz=12)
        s.text("معيار", L_EDGE + 0.25, yy, lw - 0.25 - 0.3 - 0.15 - 0.25, 0.34,
               [para(t, sz=14, pitch=20)], anchor="ctr")
    y2 = Y_BODY + crit_h + 0.12
    notes_ = [
        ("حساسية الجهة والبيانات", "تحدد ضوابط التنفيذ وشكل التدريب، وتؤخذ في الاعتبار عند اختيار حالات التطبيق."),
        ("التوسع", "إعادة استخدام ما ينجح من المحتوى والحالات، وتعديل المسارات بحسب اختلاف مهام الجهات ونتائج المرحلة الأولى."),
    ]
    avail = Y_BODY_END - y2
    nh = (avail - 0.1) / 2
    for k, (t, b) in enumerate(notes_):
        yy = y2 + k * (nh + 0.1)
        card(s, L_EDGE, yy, lw, nh, name=f"ملاحظة {t}")
        s.text(f"نص {t}", L_EDGE + 0.25, yy, lw - 0.5, nh,
               [para([run(t + ":  ", sz=14, color=PURPLE, font=F_SEMI), run(b, sz=14)], pitch=20)], anchor="ctr")
    D.source(s, "المرجع: مسودة التحديث (الشرائح 3 و7).  الحالة: إطار التغطية ومعايير الاختيار والتوسع توصية؛ التوجه إلى خمس جهات وارد في المسودة وأسماؤها تُؤكَّد.")
    new_notes(D, s, 7)
    return s


# ----------------------------------------------------------------------------- S8
def slide_tracks(D):
    s = D.content(balance("ثلاثة مسارات تجمع البساطة في الإدارة والدقة في استهداف المستفيدين"),
                  "نحدد المسار بحسب ما يُطلب من الموظف أن يقرره أو يطوره أو يطبقه في عمله.", label="tracks")
    tag(s, 2)
    tracks = [
        ("القيادات", "من يقرر", "PiCrown", PURPLE,
         "من يحدد الاتجاه ويعتمد الأولويات والاستثمار والحوكمة، مع مستويات داخلية بحسب نطاق القرار.",
         "أولويات واضحة للتبني، وحوكمة ومسؤوليات، وقرارات تدعم التنفيذ والمتابعة."),
        ("المحترفون", "من يطوّر", "PiGearSix", TEAL,
         "المتخصصون التقنيون، وخبراء المجالات ومالكو العمليات الذين يصممون الاستخدام ويشرفون على جودته.",
         "قدرة على بناء حالات الاستخدام أو إدارتها، واختبارها، وتطبيقها ضمن عمل الجهة."),
        ("الوعي والتبني", "من يطبّق", "PiUsersThree", NAVY,
         "عموم الموظفين بحسب المهام التي يؤدونها وإمكانية استفادتهم من الأدوات المتاحة في الجهة.",
         "استخدام واعٍ ومسؤول، وتحسين مهام محددة، وقدرة على مراجعة المخرجات وحدود الأداة."),
    ]
    g = 0.2
    cw = (CW - 2 * g) / 3
    band_h = 0.72
    col_h = Y_BODY_END - Y_BODY - band_h - 0.1
    hdr_h = 0.84
    h1_all = max(para(emph(w_, None, sz=14), pitch=21).height(cw - 0.4) + para("x", sz=13, pitch=19).height(cw - 0.4)
                 for (_, _, _, _, w_, _) in tracks)
    for k, (nm, verb, ic, col, who, res) in enumerate(tracks):
        x = R_EDGE - cw - k * (cw + g)
        # card body then header on top (rounded header via two shapes)
        card(s, x, Y_BODY, cw, col_h, fill=CARD, radius=0.16, name=f"مسار {nm}")
        s.box(f"رأس {nm}", x, Y_BODY, cw, hdr_h, [], geom="round2SameRect", fill=col, line=None, fit=False,
              adj={"adj1": 17000, "adj2": 0})
        s.oval("دائرة", x + cw - 0.25 - 0.62, Y_BODY + (hdr_h - 0.62) / 2, 0.62, fill=WHITE)
        s.icon(ic, col, x + cw - 0.25 - 0.62 + 0.15, Y_BODY + (hdr_h - 0.62) / 2 + 0.15, 0.32)
        s.text(f"اسم {nm}", x + 0.2, Y_BODY + 0.07, cw - 0.25 - 0.62 - 0.2 - 0.2, hdr_h - 0.14,
               [para(nm, sz=21, color=WHITE, font=F_SEMI, b=True, pitch=29),
                para(verb, sz=14, color="E6E3F4", pitch=20)], anchor="ctr")
        yy = Y_BODY + hdr_h + 0.1
        labeled(s, f"فئات {nm}", x + 0.2, yy, cw - 0.4, "الفئات بحسب الدور", who, label_color=col if col != NAVY else PURPLE)
        yy += h1_all + 0.1
        s.line("فاصل", x + 0.2, yy - 0.05, x + cw - 0.2, yy - 0.05, color=LINE, w=1)
        labeled(s, f"نتيجة {nm}", x + 0.2, yy + 0.02, cw - 0.4, "النتيجة المطلوبة", res, label_color=col if col != NAVY else PURPLE)
    banner(s, L_EDGE, Y_BODY_END - band_h, CW, band_h,
           [run("يظل المستوى الوظيفي والعائلة المهنية والتخصص جزءًا من تصميم البرنامج والترشيح. ", sz=14, color=NAVY),
            run("ويُحدد موقع المدير بحسب دوره: قيادة القرار، أو إدارة عملية تطبيق، أو استخدام الأدوات في مهامه.", sz=14, color=NAVY)],
           fill=TEAL_T, icon="PiTreeStructure", icon_fg=TEAL, icon_bg=WHITE, sz=14, pitch=20, name="تصنيف المستفيدين")
    D.source(s, "المرجع: وثيقة المهمة الوطنية (ص 4)؛ الدراسة المعيارية (ص 8)؛ OECD (2026).  الحالة: نموذج مقترح من قدراتك، وليس إعادة تصنيف رسمية للمسميات أو المراتب.")
    new_notes(D, s, 8)
    return s


# ----------------------------------------------------------------------------- S9
def slide_target(D):
    s = D.content(balance("رقم 130 ألف يصلح لبحث حجم الاستهداف بعد تحديد أساس احتسابه"),
                  "نقترح التعامل معه كفرضية تخطيطية، ثم التحقق من بياناته وفترته ونوع التدريب الذي يشمله.", label="target")
    tag(s, 2)
    zone_h = 3.3
    # right: hypothesis tile (dashed = assumption)
    rw = 4.0
    rx = R_EDGE - rw
    s.box("فرضية 130 ألف", rx, Y_BODY, rw, zone_h, [], geom="roundRect", radius=0.18, fill=PURPLE_T, line=PURPLE,
          line_w=1.5, dash="dash", fit=False)
    s.chip("فرضية تخطيطية — لم تُعتمد", rx + rw - 0.25 - 2.45, Y_BODY + 0.16, 2.45, h=0.34, fill=PURPLE, color=WHITE, sz=12)
    s.text("130 ألف", rx + 0.25, Y_BODY + 0.52, rw - 0.5, 0.88,
           [para([run("130 ألف", sz=50, color=PURPLE, font=F_SEMI, b=True), run("  موظف", sz=18, color=NAVY, font=F_SEMI)],
                 pitch=64)], anchor="ctr")
    s.text("وصف الفرضية", rx + 0.25, Y_BODY + 1.4, rw - 0.5, 0.58,
           [para("تصور ورد في النقاش، بحسب الإفادة، لتدريب نحو هذا العدد.", sz=14, pitch=20)])
    s.line("فاصل", rx + 0.25, Y_BODY + 2.06, rx + rw - 0.25, Y_BODY + 2.06, color="CDB8EA", w=1)
    half = (rw - 0.5 - 0.2) / 2
    s.text("افتراض الموظفين", rx + 0.25 + half + 0.2, Y_BODY + 2.14, half, 1.0,
           [para("على افتراض وجود", sz=12, color=MUTED, pitch=17),
            para("2.5 مليون", sz=26, color=TEAL, font=F_SEMI, b=True, pitch=34),
            para("موظف حكومي", sz=13, color=NAVY, pitch=18)])
    s.text("النسبة", rx + 0.25, Y_BODY + 2.14, half, 1.0,
           [para("أي نحو", sz=12, color=MUTED, pitch=17),
            para("5.2%", sz=26, color=TEAL, font=F_SEMI, b=True, pitch=34),
            para("من العدد المفترض", sz=13, color=NAVY, pitch=18)])
    # middle: split bar
    mw = 3.85
    mx = rx - 0.2 - mw
    card(s, mx, Y_BODY, mw, zone_h, name="التوزيع التقريبي")
    s.text("عنوان التوزيع", mx + 0.22, Y_BODY + 0.16, mw - 0.44, 0.36,
           [para("توزيع تقريبي مطروح", sz=17, color=PURPLE, font=F_SEMI, pitch=24)])
    bar_w = mw - 0.44
    segs = [("قيادات", 5, PURPLE), ("خبراء فنيون", 15, TEAL), ("الوعي والتبني", 80, NAVY)]
    bx = mx + mw - 0.22
    for nm, pc, col in segs:
        w_ = bar_w * pc / 100
        bx -= w_
        s.rect(f"شريحة {nm}", bx, Y_BODY + 0.64, w_, 0.46, fill=col, line=WHITE, line_w=1.0)
    ly = Y_BODY + 1.32
    legend = [("5%", "قيادات", PURPLE), ("15%", "خبراء فنيون", TEAL), ("الباقي (≈80%)", "الوعي والتبني", NAVY)]
    for pc, nm, col in legend:
        s.rect("لون", mx + mw - 0.22 - 0.2, ly + 0.07, 0.2, 0.2, fill=col, geom="roundRect", radius=0.04)
        s.text("بيان", mx + 0.22, ly, mw - 0.22 - 0.2 - 0.12 - 0.22, 0.34,
               [para([run(pc + "  ", sz=14, color=col if col != NAVY else NAVY, font=F_SEMI), run(nm, sz=14)], pitch=20)],
               anchor="ctr")
        ly += 0.38
    s.text("تنبيه التوزيع", mx + 0.22, Y_BODY + 2.5, mw - 0.44, 0.7,
           [para("يحتاج إلى تحديد المقصود بالقيادات والخبراء وأساس النسب.", sz=13, color=MUTED, pitch=19)])
    # left: checklist
    lx, lw = L_EDGE, mx - 0.2 - L_EDGE
    card(s, lx, Y_BODY, lw, zone_h, name="قائمة التثبيت")
    s.text("عنوان التثبيت", lx + 0.22, Y_BODY + 0.16, lw - 0.44, 0.7,
           [para("قبل اعتماد المستهدف نحتاج إلى تثبيت:", sz=16, color=PURPLE, font=F_SEMI, pitch=23)])
    items = ["عدد الموظفين المشمولين", "الفترة الزمنية", "الجهات والفئات", "مستوى التدريب", "أعداد من سبق تدريبهم"]
    for k, t in enumerate(items):
        yy = Y_BODY + 0.9 + k * 0.46
        s.icon("PiCheckCircle", TEAL, lx + lw - 0.22 - 0.3, yy + 0.04, 0.3)
        s.text("بند", lx + 0.2, yy, lw - 0.22 - 0.3 - 0.15 - 0.2, 0.38, [para(t, sz=14, pitch=20)], anchor="ctr")
    by = Y_BODY + zone_h + 0.14
    banner(s, L_EDGE, by, CW, Y_BODY_END - by,
           [run("المقترح:  ", sz=15, color=NAVY, font=F_SEMI),
            run("بناء مستهدفات منفصلة للمسارات والجهات، ثم تجميعها في مستهدف عام موثق، مع التمييز بين عدد الأفراد وعدد المشاركات التدريبية.", sz=15, color=NAVY)],
           fill=TEAL_T, icon="PiTarget", icon_fg=TEAL, icon_bg=WHITE, sz=15, pitch=22, name="المقترح")
    D.source(s, "المرجع: إفادة محمد العُمري عن النقاش مع BCG والوزارة.  الحالة: الأرقام من إفادة النقاش؛ لا تتوفر منهجية BCG الأصلية ضمن المرفقات فلا تُنسب لدراسة.")
    new_notes(D, s, 9)
    return s


# ----------------------------------------------------------------------------- S10
def slide_data(D):
    s = D.content("نستكمل البيانات الوطنية\nونبدأ تشخيص الجهات الخمس في مسارين متوازيين",
                  "البيانات الشاملة تدعم اعتماد المستهدف؛ وبيانات الجهات الأولى تدعم تصميم برامج قابلة للتطبيق.", label="data")
    tag(s, 2)
    lanes = [
        ("التقدير على مستوى الحكومة", "PiGlobeHemisphereEast", PURPLE,
         ["قائمة الجهات", "أعداد الموظفين حسب الفئات والعائلات الوظيفية", "سجل التدريب السابق", "مصدر كل بيان وتاريخه ونطاقه"],
         "تقدير حجم الشرائح، وتجنب تكرار التدريب، وتحديد المستهدفات والميزانية اللازمة للتوسع."),
        ("التشخيص في الجهات الخمس", "PiMagnifyingGlassPlus", TEAL,
         ["أهم المهام وحالات الاستخدام", "الفئات المرشحة", "المهارات الحالية", "الأدوات والبيانات المتاحة", "مسؤول التطبيق"],
         "تحديد البرامج الأولى ومخرجاتها وتكلفتها، واختيار تطبيقات يمكن قياس أثرها."),
    ]
    g = 0.2
    lw = (CW - g) / 2
    lane_h = 3.46
    hdr = 0.62
    for k, (nm, ic, col, data, use) in enumerate(lanes):
        x = R_EDGE - lw - k * (lw + g)
        card(s, x, Y_BODY, lw, lane_h, fill=CARD, radius=0.16, name=f"مسار {nm}")
        s.box(f"رأس {nm}", x, Y_BODY, lw, hdr, [], geom="round2SameRect", fill=col, line=None, fit=False,
              adj={"adj1": 25000, "adj2": 0})
        s.oval("دائرة", x + lw - 0.22 - 0.42, Y_BODY + (hdr - 0.42) / 2, 0.42, fill=WHITE)
        s.icon(ic, col, x + lw - 0.22 - 0.42 + 0.1, Y_BODY + (hdr - 0.42) / 2 + 0.1, 0.22)
        s.text(f"اسم {nm}", x + 0.2, Y_BODY, lw - 0.22 - 0.42 - 0.15 - 0.2, hdr,
               [para(nm, sz=19, color=WHITE, font=F_SEMI, b=True, pitch=27)], anchor="ctr")
        s.text("وسم البيانات", x + 0.25, Y_BODY + hdr + 0.06, lw - 0.5, 0.28,
               [para("البيانات المطلوبة", sz=13, color=col, font=F_SEMI, pitch=19)])
        yy = Y_BODY + hdr + 0.36
        for t in data:
            s.oval("نقطة", x + lw - 0.25 - 0.12, yy + 0.085, 0.12, fill=col)
            s.text("بيان", x + 0.25, yy, lw - 0.25 - 0.12 - 0.15 - 0.25, 0.29, [para(t, sz=14, pitch=19)], anchor="ctr")
            yy += 0.29
        uy = Y_BODY + 2.58
        s.line("فاصل", x + 0.25, uy - 0.05, x + lw - 0.25, uy - 0.05, color="D4D6DE", w=1)
        labeled(s, f"استخدام {nm}", x + 0.25, uy, lw - 0.5, "كيف تُستخدم", use, label_color=col, sz=14)
    by = Y_BODY + lane_h + 0.14
    banner(s, L_EDGE, by, CW, Y_BODY_END - by,
           [run("يقترح قدراتك البدء بقالب بيانات مختصر، وتحديد الجهة المالكة لكل بيان ونقطة الاتصال. ", sz=14, color=NAVY),
            run("ويمكن الاستفادة من مصادر الهيئة عن الجاهزية والتبني وحالات الاستخدام لدعم اختيار التطبيقات والجهات.", sz=14, color=NAVY)],
           fill=TEAL_T, icon="PiClipboardText", icon_fg=TEAL, icon_bg=WHITE, sz=14, pitch=20, name="قالب البيانات")
    D.source(s, "المرجع: مسودة التحديث (الشريحة 6)؛ مذكرة بيانات التبني (3 أغسطس)؛ مراسلة 29 يوليو و5 أغسطس.  الحالة: طلبات البيانات من المسودة؛ المساران والقالب توصية.")
    new_notes(D, s, 10)
    return s
