# -*- coding: utf-8 -*-
"""Build the four deliverables: AR/EN PPTX (+ PDF via LibreOffice)."""
import json, os, sys, copy, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine, theme as T

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
OUT = os.path.join(HERE, '..', 'output')

REFS = json.load(open(os.path.join(HERE, 'refs.json'), encoding='utf-8'))

def make_ref_page_specs(content_mod):
    hs = content_mod.REF_HEADERS
    tag_colors = content_mod.TAG_COLORS
    # measure split (identical for both languages since refs are shared)
    avail_first = T.FOOTER_RULE_Y - 0.30 - (T.TOP + 1.55)
    avail_cont = T.FOOTER_RULE_Y - 0.30 - (T.TOP + 0.95)
    pages, cur, cur_h = [], [], 0.0
    avail = avail_first
    for e in REFS:
        joined = '[%d] %s' % (e['n'], e['text'])
        h = engine.para_h(joined, 'reg', 8, T.CONTENT_W - 0.44, 1.18) + 0.015
        for u in e['urls']:
            h += engine.para_h(u, 'reg', 7, T.CONTENT_W - 0.44, 1.1) + 0.02
        h += 0.075
        if cur_h + h > avail and cur:
            pages.append(cur); cur, cur_h, avail = [], 0.0, avail_cont
        cur.append(e); cur_h += h
    if cur:
        pages.append(cur)
    specs = []
    for i, chunk in enumerate(pages):
        entries = [{'n': e['n'], 'text': e['text'], 'tag': e['tag'],
                    'url': e['urls'][0] if e['urls'] else None,
                    'urls': e['urls']} for e in chunk]
        blocks = []
        if i == 0:
            blocks += [{'t': 'kicker', 'text': hs['kicker']},
                       {'t': 'h1', 'text': hs['h1']},
                       {'t': 'lede', 'text': hs['lede']}]
        else:
            blocks += [{'t': 'kicker', 'text': hs['kicker_cont']},
                       {'t': 'h1', 'text': hs['h1'], 'size': 15},
                       {'t': 'gap', 'h': 0.05}]
        blocks.append({'t': 'refs', 'entries': entries, 'tag_colors': tag_colors})
        specs.append({'type': 'content', 'blocks': blocks})
    return specs

def inject_assets(pages):
    pages = copy.deepcopy(pages)
    for p in pages:
        for b in p.get('blocks', []):
            if b.get('t') == 'image' and b.get('path') == 'ASSET_CITY':
                b['path'] = os.path.join(ASSETS, 'rayan-city.png')
    return pages

def build_lang(mod, rtl, out_name):
    pages = inject_assets(mod.PAGES) + make_ref_page_specs(mod)
    assets = {'cover_bg': os.path.join(ASSETS, 'rayan-cover-bg.png')}
    os.makedirs(OUT, exist_ok=True)
    out_path = os.path.join(OUT, out_name)
    warns = engine.build(pages, rtl, mod.DOC_TITLE, assets, out_path)
    print('%s: %d pages -> %s' % (out_name, len(pages), out_path))
    for pno, y in warns:
        print('  OVERFLOW page %d: content ends at %.2f in (limit %.2f)' % (pno, y, T.FOOTER_RULE_Y))
    return out_path, warns

def to_pdf(pptx_path):
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir',
                    os.path.dirname(pptx_path), pptx_path],
                   check=True, capture_output=True, timeout=600)
    return pptx_path.replace('.pptx', '.pdf')

if __name__ == '__main__':
    langs = sys.argv[1:] or ['en', 'ar']
    if 'en' in langs:
        import content_en
        p, w = build_lang(content_en, False, 'DGA-AI-Leadership-Benchmark-EN-Final.pptx')
        if '--pdf' in sys.argv or True:
            print('PDF:', to_pdf(p))
    if 'ar' in langs:
        import content_ar
        p, w = build_lang(content_ar, True, 'DGA-AI-Leadership-Benchmark-AR-Final.pptx')
        print('PDF:', to_pdf(p))
