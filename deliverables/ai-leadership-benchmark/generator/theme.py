# -*- coding: utf-8 -*-
"""Rayan-approved DGA identity tokens (from التصميم بالألوان المعتمدة من ريان المصمم.pdf)."""
from pptx.util import Inches, Pt

# ---- palette (binding) ----
NAVY      = (0x2A, 0x20, 0x6A)   # dark navy — gradient base, table headers
NAVY_DEEP = (0x24, 0x1A, 0x5E)   # table header row
PURPLE    = (0x7C, 0x32, 0xC9)   # primary headings / kickers
TEAL      = (0x00, 0xAB, 0xAF)   # secondary accents / links
GREEN     = (0x1C, 0xC1, 0x82)   # accents, positive status
BLUE      = (0x2D, 0x9C, 0xDB)   # tertiary card accent
RED       = (0xC8, 0x45, 0x50)   # restricted / negative status
INK       = (0x23, 0x20, 0x46)   # H1 / dark text
BODY      = (0x47, 0x49, 0x56)   # body text
GRAY      = (0x6E, 0x70, 0x77)   # ledes, captions
FOOT_GRAY = (0x8A, 0x8C, 0x94)
LAV       = (0xEF, 0xEC, 0xF8)   # light lavender panels
LAV_BORDER= (0xDD, 0xD6, 0xF0)
CARD_BORDER=(0xE4, 0xE4, 0xEC)
ALT_ROW   = (0xF4, 0xF4, 0xF9)
WHITE     = (0xFF, 0xFF, 0xFF)
WHITE_70  = (0xD9, 0xD7, 0xEA)   # on dark gradient

# level colours (within approved palette)
LEVELS = {1: PURPLE, 2: NAVY, 3: TEAL, 4: GREEN}

# ---- geometry (A4 portrait) ----
PAGE_W = 8.27
PAGE_H = 11.69
MARGIN = 0.62
CONTENT_W = PAGE_W - 2 * MARGIN
TOP = 0.55
FOOTER_RULE_Y = 11.10
FOOTER_TEXT_Y = 11.16

# ---- fonts ----
FONT_DIR = '/usr/local/share/fonts/diodrum'
# style key -> (pptx family, bold flag, ttf file for measurement)
FONTS = {
    'bold':  ('Diodrum Arabic', True,  FONT_DIR + '/DiodrumArabic-Bold.ttf'),
    'semi':  ('Diodrum Arabic SemiBold', False, FONT_DIR + '/DiodrumArabic-Semibold.ttf'),
    'med':   ('Diodrum Arabic Medium', False, FONT_DIR + '/DiodrumArabic-Medium.ttf'),
    'reg':   ('Diodrum Arabic', False, FONT_DIR + '/DiodrumArabic-Regular.ttf'),
    'light': ('Diodrum Arabic Light', False, FONT_DIR + '/DiodrumArabic-Light.ttf'),
}
