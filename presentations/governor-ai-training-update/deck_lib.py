# -*- coding: utf-8 -*-
"""
deck_lib — small toolkit for building DGA-branded Arabic (RTL) decks on top of the
official "DGA Template Ar.pptx" with python-pptx + raw DrawingML.

Design notes
- All text is RTL, right aligned; typefaces are the template's own names
  (☞DIODRUM ARABIC *), which the template embeds in the file.
- Diodrum Arabic has a very tall natural line height (~1.94 em), so every paragraph
  uses an *exact* line pitch in points -> layout is identical in PowerPoint/LibreOffice.
- Text fit is estimated with HarfBuzz shaping of the real Diodrum TTFs, so overflow
  can be caught at build time (see Sl.warn()).
"""
import os
import re
import json
import subprocess
from xml.sax.saxutils import escape

import uharfbuzz as hb
from lxml import etree

# ----------------------------------------------------------------------------- units
IN = 914400


def E(v):
    """inches -> EMU"""
    return int(round(v * IN))


# ----------------------------------------------------------------------------- brand
NAVY = "2A206A"      # backgrounds only
PURPLE = "7C32C9"    # headings
TEAL = "00ABAF"      # sub-headings / table headers
GREEN = "1CC182"     # accents
WHITE = "FFFFFF"
BODY = "333333"      # body text
MUTED = "5F5F6B"     # captions on white (contrast 6.4:1)
CARD = "F5F5F5"      # neutral card
LINE = "E2E4EA"      # subtle borders
TEAL_T = "E5F6F6"    # tints derived from brand colours
PURPLE_T = "F1E9FA"
GREEN_T = "E4F7EF"
NAVY_T = "ECEAF4"

F_SEMI = "☞DIODRUM ARABIC SEMIBOLD"
F_MED = "☞DIODRUM ARABIC MEDIUM"
F_LIGHT = "☞DIODRUM ARABIC LIGHT"
F_REG = "☞DIODRUM ARABIC"

NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NSDECL = f'xmlns:a="{NS_A}" xmlns:p="{NS_P}" xmlns:r="{NS_R}"'
NS = {"a": NS_A, "p": NS_P, "r": NS_R}

# ----------------------------------------------------------------------------- measuring
FONT_DIR = os.environ.get(
    "DGA_FONT_DIR",
    "/root/.claude/skills/synced/b505a9e7-16b3-408b-bb9a-326ffa85f894_2d75fd7b-5f81-49d3-965c-2b4232bf6942/dga-pptx-designer/assets/fonts",
)
_FONT_FILES = {
    (F_SEMI, False): "DiodrumArabic-Semibold.ttf",
    (F_SEMI, True): "DiodrumArabic-Bold.ttf",
    (F_MED, False): "DiodrumArabic-Medium.ttf",
    (F_MED, True): "DiodrumArabic-Bold.ttf",
    (F_LIGHT, False): "DiodrumArabic-Light.ttf",
    (F_LIGHT, True): "DiodrumArabic-Bold.ttf",
    (F_REG, False): "DiodrumArabic-Regular.ttf",
    (F_REG, True): "DiodrumArabic-Bold.ttf",
}
_hb_cache = {}


def _hbfont(face, bold):
    key = (face, bool(bold))
    if key not in _hb_cache:
        path = os.path.join(FONT_DIR, _FONT_FILES[key])
        blob = hb.Blob.from_file_path(path)
        f = hb.Face(blob)
        _hb_cache[key] = (hb.Font(f), f.upem)
    return _hb_cache[key]


_LATIN_RE = re.compile(r"[A-Za-z0-9%.,:/+\-–_()]+")


def _split_runs(text):
    """split into (chunk, is_ltr) runs: latin/digits vs everything else"""
    out, pos = [], 0
    for m in _LATIN_RE.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()], False))
        out.append((m.group(0), True))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:], False))
    return out


def text_width(text, face, size_pt, bold=False):
    """width of a string in inches (HarfBuzz shaped)"""
    font, upem = _hbfont(face, bold)
    total = 0
    for chunk, ltr in _split_runs(text):
        buf = hb.Buffer()
        buf.add_str(chunk)
        buf.direction = "ltr" if ltr else "rtl"
        buf.script = "Latn" if ltr else "Arab"
        buf.language = "en" if ltr else "ar"
        hb.shape(font, buf, {"kern": True, "liga": True})
        total += sum(p.x_advance for p in buf.glyph_positions)
    return total / upem * size_pt / 72.0


# ----------------------------------------------------------------------------- text specs
class Run:
    __slots__ = ("t", "sz", "color", "font", "b", "i", "link")

    def __init__(self, t, sz=14, color=BODY, font=F_MED, b=False, i=False, link=None):
        self.t, self.sz, self.color, self.font, self.b, self.i, self.link = t, sz, color, font, b, i, link


def run(t, sz=14, color=BODY, font=F_MED, b=False, i=False, link=None):
    return Run(t, sz, color, font, b, i, link)


class Para:
    def __init__(self, runs, algn="r", pitch=None, before=0, after=0, bullet=None,
                 marL=0.0, indent=0.0, bucolor=None, rtl=True):
        self.runs = runs
        self.algn = algn
        mx = max(r.sz for r in runs) if runs else 14
        self.pitch = pitch if pitch else round(mx * 1.5)
        self.before, self.after = before, after
        self.bullet, self.marL, self.indent = bullet, marL, indent
        self.bucolor = bucolor
        self.rtl = rtl

    # estimated number of lines when laid out in `width` inches (3% safety on width)
    def lines(self, width):
        avail = (width - self.marL) * 0.97
        if avail <= 0.1:
            return 99
        toks = []
        for r in self.runs:
            parts = re.split(r"(\s+)", r.t)
            for p in parts:
                if p == "":
                    continue
                toks.append((p, r))
        lines, cur = 1, 0.0
        for p, r in toks:
            if p.isspace():
                cur += text_width(" ", r.font, r.sz, r.b) * len(p)
                continue
            w = text_width(p, r.font, r.sz, r.b)
            if cur > 0 and cur + w > avail:
                lines += 1
                cur = w
            else:
                cur += w
        # explicit line breaks
        lines += sum(r.t.count("\n") for r in self.runs)
        return lines

    def height(self, width):
        return (self.lines(width) * self.pitch + self.before + self.after) / 72.0


def para(content, sz=14, color=BODY, font=F_MED, b=False, i=False, **kw):
    if isinstance(content, str):
        runs = [Run(content, sz, color, font, b, i)]
    else:
        runs = [c if isinstance(c, Run) else Run(c, sz, color, font, b, i) for c in content]
    return Para(runs, **kw)


def paras_height(paras, width):
    return sum(p.height(width) for p in paras)


# ----------------------------------------------------------------------------- xml builders
def _lang(t):
    return "en-US" if (re.search(r"[A-Za-z]", t) and not re.search(r"[؀-ۿ]", t)) else "ar-SA"


def run_xml(r):
    hl = f'<a:hlinkClick r:id="{r.link}"/>' if r.link else ""
    t = escape(r.t)
    return (
        f'<a:r><a:rPr lang="{_lang(r.t)}" sz="{int(round(r.sz * 100))}" b="{int(r.b)}" i="{int(r.i)}" dirty="0" noProof="1">'
        f'<a:solidFill><a:srgbClr val="{r.color}"/></a:solidFill>'
        f'<a:latin typeface="{r.font}" pitchFamily="2" charset="-78"/>'
        f'<a:cs typeface="{r.font}" pitchFamily="2" charset="-78"/>{hl}</a:rPr>'
        f"<a:t>{t}</a:t></a:r>"
    )


def para_xml(p):
    parts = []
    # explicit "\n" inside a run -> a:br
    for r in p.runs:
        segs = r.t.split("\n")
        for k, seg in enumerate(segs):
            if k > 0:
                parts.append(f'<a:br><a:rPr lang="ar-SA" sz="{int(r.sz*100)}" dirty="0"/></a:br>')
            if seg != "":
                rr = Run(seg, r.sz, r.color, r.font, r.b, r.i, r.link)
                parts.append(run_xml(rr))
    if p.bullet:
        bu = (f'<a:buClr><a:srgbClr val="{p.bucolor or TEAL}"/></a:buClr>'
              f'<a:buFont typeface="Arial"/><a:buChar char="{p.bullet}"/>')
    else:
        bu = "<a:buNone/>"
    ppr = (
        f'<a:pPr marL="{E(p.marL)}" indent="{E(p.indent)}" algn="{p.algn}" rtl="{int(p.rtl)}">'
        f'<a:lnSpc><a:spcPts val="{int(round(p.pitch*100))}"/></a:lnSpc>'
        f'<a:spcBef><a:spcPts val="{int(round(p.before*100))}"/></a:spcBef>'
        f'<a:spcAft><a:spcPts val="{int(round(p.after*100))}"/></a:spcAft>{bu}</a:pPr>'
    )
    mx = max((r.sz for r in p.runs), default=14)
    end = f'<a:endParaRPr lang="ar-SA" sz="{int(mx*100)}" dirty="0"/>'
    return f"<a:p>{ppr}{''.join(parts)}{end}</a:p>"


def body_xml(paras, anchor="t", ins=(0.0, 0.0, 0.0, 0.0), wrap=True):
    l, t, r, b = ins
    ps = "".join(para_xml(p) for p in paras) if paras else '<a:p><a:endParaRPr lang="ar-SA"/></a:p>'
    return (
        f'<p:txBody><a:bodyPr wrap="{"square" if wrap else "none"}" lIns="{E(l)}" tIns="{E(t)}" rIns="{E(r)}" bIns="{E(b)}" '
        f'rtlCol="0" anchor="{anchor}"><a:noAutofit/></a:bodyPr><a:lstStyle/>{ps}</p:txBody>'
    )


def _fill_xml(fill):
    if fill is None:
        return "<a:noFill/>"
    return f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'


def _ln_xml(line, w=0.75, dash=None):
    if line is None:
        return "<a:ln><a:noFill/></a:ln>"
    d = f'<a:prstDash val="{dash}"/>' if dash else ""
    return f'<a:ln w="{int(w*12700)}"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill>{d}</a:ln>'


SHADOW = (
    '<a:effectLst><a:outerShdw blurRad="76200" dist="19050" dir="5400000" algn="t" rotWithShape="0">'
    '<a:srgbClr val="2A206A"><a:alpha val="13000"/></a:srgbClr></a:outerShdw></a:effectLst>'
)


def sp_xml(i, name, x, y, w, h, paras=None, geom="rect", radius=None, fill=None, line=None,
           line_w=0.75, dash=None, anchor="t", ins=(0.1, 0.05, 0.1, 0.05), shadow=False,
           txbox=False, descr="", flipH=False, adj=None):
    av = "<a:avLst/>"
    if geom == "roundRect":
        rad = radius if radius is not None else 0.12
        a = int(min(50000, rad / max(0.01, min(w, h)) * 100000))
        av = f'<a:avLst><a:gd name="adj" fmla="val {a}"/></a:avLst>'
    elif adj is not None:
        av = "<a:avLst>" + "".join(f'<a:gd name="{k}" fmla="val {v}"/>' for k, v in adj.items()) + "</a:avLst>"
    flip = ' flipH="1"' if flipH else ""
    body = body_xml(paras, anchor, ins) if paras is not None else ""
    cnv = '<p:cNvSpPr txBox="1"/>' if txbox else "<p:cNvSpPr/>"
    d = f' descr="{escape(descr)}"' if descr else ""
    return (
        f'<p:sp {NSDECL}><p:nvSpPr><p:cNvPr id="{i}" name="{escape(name)}"{d}/>{cnv}<p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm{flip}><a:off x="{E(x)}" y="{E(y)}"/><a:ext cx="{E(w)}" cy="{E(h)}"/></a:xfrm>'
        f'<a:prstGeom prst="{geom}">{av}</a:prstGeom>{_fill_xml(fill)}{_ln_xml(line, line_w, dash)}'
        f'{SHADOW if shadow else ""}</p:spPr>{body}</p:sp>'
    )


def line_xml(i, name, x1, y1, x2, y2, color=LINE, w=1.0, dash=None, cap="rnd", head=None):
    x, y = min(x1, x2), min(y1, y2)
    cx, cy = abs(x2 - x1), abs(y2 - y1)
    fh = ' flipH="1"' if x2 < x1 else ""
    fv = ' flipV="1"' if y2 < y1 else ""
    d = f'<a:prstDash val="{dash}"/>' if dash else ""
    he = f'<a:tailEnd type="{head}" w="med" len="med"/>' if head else ""
    return (
        f'<p:cxnSp {NSDECL}><p:nvCxnSpPr><p:cNvPr id="{i}" name="{escape(name)}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>'
        f'<p:spPr><a:xfrm{fh}{fv}><a:off x="{E(x)}" y="{E(y)}"/><a:ext cx="{E(cx)}" cy="{E(cy)}"/></a:xfrm>'
        f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
        f'<a:ln w="{int(w*12700)}" cap="{cap}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>{d}{he}</a:ln></p:spPr></p:cxnSp>'
    )


# ----------------------------------------------------------------------------- icons
ICON_NODE_MODULES = os.environ.get(
    "ICON_NODE_MODULES",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "node_modules"),   # `npm install` inside this folder
)


class Icons:
    def __init__(self, cache_dir):
        self.dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        self.here = os.path.dirname(os.path.abspath(__file__))

    def path(self, name, color):
        out = os.path.join(self.dir, f"{name}_{color}.png")
        if not os.path.exists(out):
            job = json.dumps([{"name": name, "color": color, "out": out, "size": 384}])
            env = dict(os.environ, ICON_NODE_MODULES=ICON_NODE_MODULES)
            r = subprocess.run(["node", os.path.join(self.here, "render_icons.js"), job],
                               capture_output=True, text=True, env=env)
            if r.returncode != 0 or not os.path.exists(out):
                raise RuntimeError(f"icon {name} failed: {r.stderr}")
        return out


# ----------------------------------------------------------------------------- slide wrapper
class Sl:
    """wraps a python-pptx slide; every add_* appends a shape to the spTree (z-order = call order)"""

    def __init__(self, slide, icons, label=""):
        self.slide = slide
        self.tree = slide.shapes._spTree
        self.icons = icons
        self.label = label
        self.warnings = []

    # ---- ids
    def nid(self):
        ids = [int(e.get("id")) for e in self.tree.iter() if e.tag.endswith("}cNvPr") and e.get("id", "").isdigit()]
        return (max(ids) if ids else 1) + 1

    def _append(self, xml):
        el = etree.fromstring(xml)
        self.tree.append(el)
        return el

    def warn(self, msg):
        self.warnings.append(msg)
        print(f"   ⚠ [{self.label}] {msg}")

    # ---- primitives
    def box(self, name, x, y, w, h, paras=None, fit=True, **kw):
        """rectangle / rounded rectangle, optionally with text"""
        kw.setdefault("ins", (0.1, 0.05, 0.1, 0.05))
        if paras is not None and fit:
            l, t, r, b = kw["ins"]
            need = paras_height(paras, w - l - r) + t + b
            if need > h + 0.02:
                self.warn(f"'{name}' text needs {need:.2f}in but box is {h:.2f}in")
        return self._append(sp_xml(self.nid(), name, x, y, w, h, paras, **kw))

    def text(self, name, x, y, w, h, paras, anchor="t", ins=(0, 0, 0, 0), fit=True, **kw):
        if fit:
            l, t, r, b = ins
            need = paras_height(paras, w - l - r) + t + b
            if need > h + 0.02:
                self.warn(f"'{name}' text needs {need:.2f}in but box is {h:.2f}in")
        return self._append(sp_xml(self.nid(), name, x, y, w, h, paras, anchor=anchor, ins=ins, txbox=True, **kw))

    def rect(self, name, x, y, w, h, fill=None, line=None, **kw):
        return self._append(sp_xml(self.nid(), name, x, y, w, h, None, fill=fill, line=line, **kw))

    def oval(self, name, x, y, d, fill=None, line=None, **kw):
        return self._append(sp_xml(self.nid(), name, x, y, d, d, None, geom="ellipse", fill=fill, line=line, **kw))

    def line(self, name, x1, y1, x2, y2, color=LINE, w=1.0, dash=None, head=None):
        return self._append(line_xml(self.nid(), name, x1, y1, x2, y2, color, w, dash, head=head))

    def link(self, url):
        from pptx.opc.constants import RELATIONSHIP_TYPE as RT
        return self.slide.part.relate_to(url, RT.HYPERLINK, is_external=True)

    def icon(self, name, color, x, y, size, descr=""):
        pic = self.slide.shapes.add_picture(self.icons.path(name, color), E(x), E(y), E(size), E(size))
        pic.name = f"أيقونة {name[2:]}"
        c = pic._element.nvPicPr.cNvPr
        c.set("descr", descr)
        return pic

    # ---- composites
    def icon_badge(self, name_icon, x, y, d=0.62, bg=TEAL_T, fg=TEAL, scale=0.54):
        self.oval("دائرة أيقونة", x, y, d, fill=bg)
        s = d * scale
        self.icon(name_icon, fg, x + (d - s) / 2, y + (d - s) / 2, s)

    def chip(self, text, x, y, w, h=0.34, fill=PURPLE_T, color=PURPLE, sz=12, font=F_SEMI):
        self.box("وسم", x, y, w, h,
                 [para(text, sz=sz, color=color, font=font, algn="ctr", pitch=sz * 1.25)],
                 geom="roundRect", radius=h / 2, fill=fill, anchor="ctr", ins=(0.06, 0.0, 0.06, 0.0), fit=False)

    def number_badge(self, n, x, y, d=0.46, fill=GREEN, color=WHITE, sz=16):
        self.box("رقم", x, y, d, d,
                 [para(str(n), sz=sz, color=color, font=F_SEMI, b=True, algn="ctr", pitch=sz * 1.2)],
                 geom="ellipse", fill=fill, anchor="ctr", ins=(0, 0, 0, 0), fit=False)

    # ---- table (native, RTL: first column is the right-most)
    def table(self, name, x, y, col_w, rows, hdr_fill=TEAL, hdr_color=WHITE, hdr_sz=14,
              zebra=True, border=LINE, min_h=0.5, hdr_h=0.5, max_bottom=None,
              margins=(0.14, 0.07, 0.14, 0.07), first_col_fill=None, anchor="ctr"):
        """rows[0] = header (list of Para lists | str); other rows = list of cells.
        cell = str | Para | list[Para] | dict(paras=..., fill=..., anchor=...)"""
        ml, mt, mr, mb = margins

        def norm(c, hdr=False, first=False):
            fill = None
            anc = anchor
            if isinstance(c, dict):
                fill = c.get("fill")
                anc = c.get("anchor", anchor)
                c = c["paras"]
            if isinstance(c, str):
                c = [para(c, sz=hdr_sz if hdr else 14, color=hdr_color if hdr else BODY,
                          font=F_SEMI if hdr else F_MED, b=False)]
            elif isinstance(c, Para):
                c = [c]
            return c, fill, anc

        heights = []
        grid = []
        for ri, row in enumerate(rows):
            cells = []
            hmax = 0
            for ci, c in enumerate(row):
                ps, fill, anc = norm(c, hdr=(ri == 0), first=(ci == 0))
                need = paras_height(ps, col_w[ci] - ml - mr) + mt + mb
                hmax = max(hmax, need)
                cells.append((ps, fill, anc))
            base = hdr_h if ri == 0 else min_h
            heights.append(max(base, hmax))
            grid.append(cells)
        total_h = sum(heights)
        if max_bottom is not None and y + total_h > max_bottom + 0.01:
            self.warn(f"table '{name}' bottom {y + total_h:.2f}in exceeds {max_bottom:.2f}in")

        def bdr(tag, color, w=0.75):
            if color is None:
                return f"<a:{tag} w=\"0\"><a:noFill/></a:{tag}>"
            return (f'<a:{tag} w="{int(w*12700)}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="{color}"/>'
                    f'</a:solidFill><a:prstDash val="solid"/></a:{tag}>')

        trs = []
        for ri, cells in enumerate(grid):
            tcs = []
            for ci, (ps, fill, anc) in enumerate(cells):
                if ri == 0:
                    f = hdr_fill
                elif fill:
                    f = fill
                elif first_col_fill and ci == 0:
                    f = first_col_fill
                elif zebra and ri % 2 == 0:
                    f = CARD
                else:
                    f = WHITE
                tx = "".join(para_xml(p) for p in ps)
                tcs.append(
                    f'<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>{tx}</a:txBody>'
                    f'<a:tcPr marL="{E(ml)}" marR="{E(mr)}" marT="{E(mt)}" marB="{E(mb)}" anchor="{anc}">'
                    f'{bdr("lnL", None)}{bdr("lnR", None)}{bdr("lnT", border if ri > 0 else None)}{bdr("lnB", border)}'
                    f'<a:solidFill><a:srgbClr val="{f}"/></a:solidFill></a:tcPr></a:tc>'
                )
            tcs.reverse()          # logical first column -> physical right-most (RTL look, renderer-independent)
            trs.append(f'<a:tr h="{E(heights[ri])}">{"".join(tcs)}</a:tr>')
        grid_xml = "".join(f'<a:gridCol w="{E(w)}"/>' for w in reversed(col_w))
        i = self.nid()
        xml = (
            f'<p:graphicFrame {NSDECL}><p:nvGraphicFramePr><p:cNvPr id="{i}" name="{escape(name)}"/>'
            f'<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
            f'<p:xfrm><a:off x="{E(x)}" y="{E(y)}"/><a:ext cx="{E(sum(col_w))}" cy="{E(total_h)}"/></p:xfrm>'
            f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            f'<a:tbl><a:tblPr firstRow="1"/><a:tblGrid>{grid_xml}</a:tblGrid>{"".join(trs)}</a:tbl>'
            f'</a:graphicData></a:graphic></p:graphicFrame>'
        )
        self._append(xml)
        return total_h
