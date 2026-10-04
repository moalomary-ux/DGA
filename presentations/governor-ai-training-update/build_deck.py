# -*- coding: utf-8 -*-
"""
Build: "التدريب في الذكاء الاصطناعي — تحديث لمعالي المحافظ" (DGA / قدراتك), 5 Oct 2026.

Usage:  python3 build_deck.py [--out PATH] [--show-hidden] [--thumb JPG]
Needs:  python-pptx, lxml, uharfbuzz; node + react-icons/sharp (see deck_lib.ICON_NODE_MODULES);
        the DGA skill assets (template + Diodrum fonts) — override with DGA_SKILL_DIR / DGA_FONT_DIR.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from components import *        # noqa: F401,F403
import slides_front as F
import slides_s2 as S2
import slides_s3 as S3
import slides_s4 as S4
import slides_app as A


# ----------------------------------------------------------------------------- build
def build(out, show_hidden=False, thumb=None, icons_dir=None, internal_slides=True):
    D = Deck(icons_dir or os.path.join(HERE, ".icons_cache"))
    F.slide_cover(D)
    F.slide_agenda(D)
    F.slide_exec(D)
    F.divider1(D)
    F.slide_roles(D)
    F.slide_meetings(D)
    F.slide_delivered(D)
    S2.divider2(D)
    S2.slide_choices(D)
    S2.slide_framework(D)
    S2.slide_tracks(D)
    S2.slide_target(D)
    S2.slide_data(D)
    S3.divider3(D)
    S3.slide_leaders(D)
    S3.slide_professionals(D)
    S3.slide_awareness(D)
    S3.slide_partners(D)
    S3.slide_funding(D)
    S4.divider4(D)
    S4.slide_plan(D)
    S4.slide_measure(D)
    S4.slide_asks(D)
    A.divider_app(D)
    A.app1(D)
    A.app2(D)
    A.app3a(D)
    A.app3b(D)
    A.app3c(D)
    A.app4(D)
    for part in (1, 2, 3):
        A.app5(D, part)
    for part in (1, 2, 3):
        A.refs(D, part)
    internal = ([A.internal_notes(D)] + A.evidence(D)) if internal_slides else []
    if not show_hidden:
        for sl in internal:
            D.hide(sl)
    # page-number sanity: planned PAGE map vs actual order
    idx = {x["label"]: i + 1 for i, x in enumerate(D.slides)}
    expect = {"divider 1": PAGE["d1"], "roles": PAGE["roles"], "meetings": PAGE["meetings"], "delivered": PAGE["delivered"],
              "divider 2": PAGE["d2"], "divider 3": PAGE["d3"], "partners": PAGE["partners"], "divider 4": PAGE["d4"],
              "asks": PAGE["asks"], "divider app": PAGE["appendix"]}
    for lab, pg in expect.items():
        got = idx.get(lab)
        if got != pg:
            print(f"   ⚠ page map mismatch: {lab} planned {pg} actual {got}")
    n_warn = sum(len(x["sl"].warnings) for x in D.slides)
    hidden = 0 if show_hidden else len(internal)
    D.custom_show("إحاطة موجزة للمحافظ (9 شرائح)",
                  ["cover", "exec", "delivered", "framework", "tracks", "target", "funding", "plan", "asks"])
    D.finalize(out, "التدريب في الذكاء الاصطناعي — تحديث لمعالي المحافظ",
               "برنامج قدراتك — هيئة الحكومة الرقمية", "برنامج قدراتك — هيئة الحكومة الرقمية",
               keywords="الذكاء الاصطناعي، التدريب، قدراتك، هيئة الحكومة الرقمية", thumb_jpeg=thumb, hidden=hidden)
    print(f"saved {out}  slides={len(D.slides)}  warnings={n_warn}")
    return D


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "ai-training-governor-update-2026-10-05.pptx"))
    ap.add_argument("--show-hidden", action="store_true")
    ap.add_argument("--thumb", default=None)
    ap.add_argument("--icons", default=None)
    ap.add_argument("--no-internal", action="store_true", help="omit the internal (hidden) review slides")
    a = ap.parse_args()
    build(a.out, a.show_hidden, a.thumb, a.icons, internal_slides=not a.no_internal)
