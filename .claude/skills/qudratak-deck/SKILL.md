---
name: qudratak-deck
description: Build or improve executive decks for برنامج القدرات الرقمية «قدراتك» (DGA Digital Skills program) on the Qudratak progress-report template. Use whenever the user asks for a قدراتك / Qudratak presentation, تقرير سير الأعمال, a progress-report deck, or asks to improve an uploaded DGA-branded .pptx while keeping its visual DNA. Encodes the user's approved layout rules and preferences.
---

# Qudratak (قدراتك) deck builder

Reusable tooling and the user's approved conventions for the قدراتك quarterly progress report and similar DGA-branded decks. Built and approved in September 2026 for the Jun–Aug 2026 report.

## Files

| Path | What it is |
|---|---|
| `scripts/dga_deck.py` | python-pptx helper library: brand tokens, RTL text, cards, hero bands, chips, status pills, tables (RTL-safe), charts, dividers, header page number, footer removal, speaker notes. |
| `scripts/build_qudratak_report.py` | Full worked example: the 22-slide Jun–Aug 2026 report. Copy and edit the content blocks for a new period. |
| `assets/qudratak-base-22.pptx` | Structural base derived from the user's own template: 22 slides already ordered (cover, agenda, exec summary, 3 sections with sub-dividers, closing). Content slides get cleared and rebuilt by the script. |
| `assets/mcit_logo.png` | Cropped Ministry of Communications and IT logo (the template's original was mostly whitespace and carried a watermark). |
| `assets/media/` | Icons and partner logos extracted from the template (program icon, workshop icon, GCC award logo, Google Cloud, KSU, partner university). |

## Workflow

1. Extract the source deck's text with `python -m markitdown deck.pptx` and render it (`soffice.py --convert-to pdf` then `pdftoppm`) to understand its DNA before changing anything.
2. If the structure changes, duplicate slides with the pptx skill's `add_slide.py` on the unpacked package, reorder `<p:sldIdLst>`, strip the copied `notesSlide` rels from duplicates, repack. `assets/qudratak-base-22.pptx` already has the 22-slide structure.
3. Run the build: `DECK_SRC=base.pptx DECK_OUT=out.pptx DECK_MEDIA=<media dir> DECK_ASSETS=<assets dir> python build_qudratak_report.py`.
4. QA: render to images and look at every slide; run `validate.py out.pptx --original <source>.pptx`; grep the text dump for placeholder or forbidden words (see below).
5. Deliver the .pptx plus a PDF preview, and commit the deck under `docs/presentations/`.

Dependencies: `pip install python-pptx markitdown[pptx] defusedxml lxml Pillow`; LibreOffice needs `libreoffice-impress` and `poppler-utils`; copy the Diodrum Arabic fonts from the dga-pptx-designer skill into `~/.fonts` and run `fc-cache -f` so renders match PowerPoint.

## Approved conventions (user decisions, keep them)

- **No classification footer.** The user asked to delete the "Restricted - مقيد" text everywhere. `remove_footers(prs)` strips the footer placeholder from every slide. Do not reintroduce it, and do not mention the classification in speaker notes.
- **DNA footer, restyled.** On content slides and sub-dividers, `footer(slide)` keeps the page number bottom-left under the layout's small green dash (navy, 10.5pt semibold) and adds the deck title bottom-right next to the DGA watermark (9pt regular, muted gray, `DECK_TITLE` env var). The user explicitly rejected putting the page number in the header.
- **Keep the deck's DNA.** Never redraw the cover, agenda background, section dividers (photo + big green number), sub-dividers (green badge + section title) or the closing slide. Edit their text only. Content slides are rebuilt on the `2_Title` layout, which supplies the bottom curve and the small DGA watermark.
- **Title row:** `content_frame(slide, '1.1', 'Title', lead)` renders the number in dark purple, the title in navy 24pt bold, the gradient teal→purple rule under it, and an optional teal 13pt lead line.
- **Agenda:** three semi-transparent cards (01/02/03) with green gradient badges, section title 17pt bold white, items 12pt with the code in mint. Executive summary is unnumbered and comes right after the agenda.
- **Section dividers** carry a one-line teal subtitle under the title, and the three-dash progress indicator (`prog1..prog3`) highlights the current section.
- **Sub-dividers** carry a one-line key message in teal under the 36pt subtitle. Long subtitles are moved up (`t.top = 3.1in`) and the key message down (`key_y=4.5`).
- **Numbers:** Western digits, thousands separators (1,273), percentages computed and shown. Every KPI needs a label and, where possible, a denominator or comparison.
- **Colors:** navy `2A206A` body headings, purple `7C32C9` numbers/section titles, teal `00ABAF` leads and table headers, green `1CC182` accents and progress, hero bands use the navy gradient `1D164B→3B2D8A`. Status: green = على المسار / منجز, amber `F0A322` = يتطلب متابعة, red `E0525E` = عالية.
- **Fonts:** DiodrumArabic-Bold (titles, numbers), -Semibold (labels, table headers), -Medium (body), -Regular (captions). Set on both `latin` and `cs`; all paragraphs `rtl="1"` and right-aligned except numbers-only cells (centred).
- **Tables:** pass columns in logical RTL order (first = rightmost); the helper reverses them physically so LibreOffice and PowerPoint agree. Teal header, zebra rows, white hairlines, 10–10.5pt. Add right padding (`pad_right={col: 0.36}`) when overlaying a status dot in a cell.
- **Content-slide grid:** margins x 0.45–12.9in, content y 1.1–6.3in (the footer curve starts around 6.4in). Cards use 0.22–0.3in gaps, radius 0.1in, soft navy shadow, hairline border `E1E0EC`.
- **Speaker notes on every slide**, Arabic, executive tone: what the numbers mean, what is at risk, what the audience is asked to decide.
- **Report skeleton the user approved:** cover → agenda → executive summary (KPIs + RAG table + key message) → 01 training programs (cumulative vs target, quarter by month with native column chart, next-month plan table) → 02 initiatives (one slide each: intro band, requirement cards with status pills, stage tracker, timeline) → 03 conclusion (risks & required decisions table, next-period plan with monthly milestones) → thanks.

## Content rules of thumb

- Proofread Arabic: الاصطناعي (not الإصطناعي), الأجندة, الأعمال, العامة, الداعمة, الأتمتة, الابتكار, والإفتاء.
- Do not invent facts. Derived metrics (gap to target, monthly run-rate, ratios) are fine when the inputs are on the slide; label recommendations as مقترح.
- Drop hidden or off-slide scratch text from the source deck rather than surfacing it.
- After the grep for leftovers, also check `grep -c "مقيد"` returns 0 on the text dump.
