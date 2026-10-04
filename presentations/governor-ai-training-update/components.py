# -*- coding: utf-8 -*-
"""Shared structure + layout helpers used by every slide module."""
import os
import sys

from deck_lib import *          # noqa: F401,F403
from deck_core import *         # noqa: F401,F403
from notes_data import NOTES, EVIDENCE_TITLES, notes_paragraphs

# ----------------------------------------------------------------------------- structure
SECTIONS = {
    1: ("أين وصلنا؟", "الأدوار والاجتماعات وما أُنجز حتى الآن"),
    2: ("النموذج المقترح", "خيارات التصميم والإطار والمسارات والمستهدف والبيانات"),
    3: ("تصميم المسارات والشراكات والتمويل", "القيادات والمحترفون والوعي، وعروض الشركاء، والتمويل"),
    4: ("التنفيذ والقياس والتوجيهات", "خطة العمل، ومؤشرات القياس، والمطلوب من معاليكم"),
}
# planned page numbers (asserted at the end)
PAGE = dict(agenda=2, exec=3, d1=4, roles=5, meetings=6, delivered=7, d2=8, d3=14, partners=18, d4=20, asks=23, appendix=24)


# ----------------------------------------------------------------------------- helpers
def balance(text, size=28, max_w=11.2):
    """insert a single line break so a long title wraps into two balanced lines"""
    if "\n" in text or text_width(text, F_SEMI, size, True) <= max_w:
        return text
    words = text.split(" ")
    best, best_d = None, 1e9
    for i in range(2, len(words) - 1):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        wa, wb = text_width(a, F_SEMI, size, True), text_width(b, F_SEMI, size, True)
        if max(wa, wb) <= max_w and abs(wa - wb) < best_d:
            best, best_d = a + "\n" + b, abs(wa - wb)
    return best or text


def tag(s, n):
    name = SECTIONS[n][0]
    s.chip(f"القسم {n}  ·  {name}", L_EDGE, 0.10, 3.4, 0.30, fill=TEAL_T, color=TEAL, sz=11)


def card(s, x, y, w, h, fill=CARD, line=None, shadow=False, radius=0.14, name="بطاقة"):
    s.box(name, x, y, w, h, [], geom="roundRect", radius=radius, fill=fill, line=line, shadow=shadow, fit=False)


def emph(text, marks, sz=14, color=BODY, mcolor=PURPLE, font=F_MED, mfont=F_SEMI):
    """runs list: substrings in `marks` rendered semibold/coloured"""
    import re
    if not marks:
        return [run(text, sz, color, font)]
    pat = "(" + "|".join(re.escape(m) for m in marks) + ")"
    out = []
    for part in re.split(pat, text):
        if not part:
            continue
        out.append(run(part, sz, mcolor, mfont) if part in marks else run(part, sz, color, font))
    return out


def labeled(s, name, x, y, w, label, text, label_color=TEAL, sz=14, label_sz=13, marks=None, gap=0.02):
    """small semibold label above a paragraph; returns total height used"""
    lab = para(label, sz=label_sz, color=label_color, font=F_SEMI, pitch=label_sz * 1.5)
    body = para(emph(text, marks, sz=sz), pitch=sz * 1.5)
    h = lab.height(w) + body.height(w) + gap
    s.text(name, x, y, w, h, [lab, body], fit=False)
    return h


def banner(s, x, y, w, h, runs, fill=TEAL_T, icon=None, icon_fg=TEAL, icon_bg=WHITE, line=None, sz=15, pitch=None,
           name="شريط"):
    card(s, x, y, w, h, fill=fill, line=line, radius=0.12, name=name)
    tx_right = x + w - 0.25
    if icon:
        d = min(0.56, h - 0.2)
        s.icon_badge(icon, x + w - 0.2 - d, y + (h - d) / 2, d=d, bg=icon_bg, fg=icon_fg)
        tx_right = x + w - 0.2 - d - 0.2
    s.text(name + " نص", x + 0.25, y, tx_right - (x + 0.25), h, [para(runs, sz=sz, pitch=pitch or sz * 1.5)],
           anchor="ctr")


def chevron(s, x, y, w, h, text, fill, color=WHITE, sz=16, name="مرحلة"):
    s.box(name, x, y, w, h,
          [para(text, sz=sz, color=color, font=F_SEMI, algn="ctr", pitch=sz * 1.4)],
          geom="homePlate", fill=fill, anchor="ctr", ins=(0.38, 0.0, 0.15, 0.0), flipH=True, fit=False,
          adj={"adj": 32000})


def new_notes(D, s, n, extra_top=None, page=None):
    D.notes(s, notes_paragraphs(n, deck_page=page or len(D.slides), extra_top=extra_top))


