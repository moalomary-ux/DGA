#!/usr/bin/env bash
# Installs the Qudratak progress-report add-on into the ard-althakaa (عرض الذكاء) skill.
# Usage: bash install.sh [path-to-skill]   (default: ~/.claude/skills/ard-althakaa)
set -euo pipefail
SKILL="${1:-$HOME/.claude/skills/ard-althakaa}"
HERE="$(cd "$(dirname "$0")" && pwd)"
# Layout A: the add-on zip (./ard-althakaa/{references,tools,assets/qudratak}).
# Layout B: the repo skill (.claude/skills/qudratak-deck/{scripts,assets} with this script in ard-althakaa-addon/).
if [ -d "$HERE/ard-althakaa" ]; then
  REF="$HERE/ard-althakaa/references/qudratak-progress-report.md"
  TOOLS="$HERE/ard-althakaa/tools"; BASE="$HERE/ard-althakaa/assets/qudratak"; MEDIA="$BASE/media"
else
  REF="$HERE/qudratak-progress-report.md"
  TOOLS="$HERE/../scripts"; BASE="$HERE/../assets"; MEDIA="$BASE/media"
fi

if [ ! -f "$SKILL/SKILL.md" ]; then
  echo "❌ لم يتم العثور على المهارة في: $SKILL"; exit 1
fi

mkdir -p "$SKILL/references" "$SKILL/tools" "$SKILL/assets/qudratak/media"
cp "$REF" "$SKILL/references/"
cp "$TOOLS/dga_deck.py" "$TOOLS/build_qudratak_report.py" "$SKILL/tools/"
cp "$BASE/qudratak-base-22.pptx" "$BASE/mcit_logo.png" "$SKILL/assets/qudratak/"
cp "$MEDIA/"* "$SKILL/assets/qudratak/media/"

# Point SKILL.md at the new reference (idempotent)
if ! grep -q "qudratak-progress-report.md" "$SKILL/SKILL.md"; then
cat >> "$SKILL/SKILL.md" <<'EOF'

## Qudratak progress report add-on (v5.1 — Sep 2026)

For برنامج القدرات الرقمية «قدراتك» decks (تقرير سير الأعمال, quarterly progress report, or improving an uploaded DGA/Qudratak .pptx while keeping its DNA), read `references/qudratak-progress-report.md` first. It records the user's approved decisions (no "مقيد" classification footer, page number bottom-left + deck title bottom-right in the DNA footer, agenda/section/sub-divider conventions, the approved report skeleton) and points to the reusable tooling in `tools/dga_deck.py`, `tools/build_qudratak_report.py` and `assets/qudratak/`.
EOF
fi

# Changelog entry (idempotent)
CHANGELOG="$SKILL/references/CHANGELOG.md"
if ! grep -q "Qudratak progress report add-on" "$CHANGELOG" 2>/dev/null; then
cat >> "$CHANGELOG" <<'EOF'

## v5.1 — 2026-09-03 — Qudratak progress report add-on
- Added `references/qudratak-progress-report.md`: approved conventions for تقرير سير الأعمال الربعي لبرنامج قدراتك (no classification footer, DNA footer with page number bottom-left and deck title bottom-right, agenda/section/sub-divider rules, report skeleton, Arabic proofreading list).
- Added `tools/dga_deck.py` (python-pptx helper library) and `tools/build_qudratak_report.py` (22-slide worked example).
- Added `assets/qudratak/` (22-slide base template, cropped MCIT logo, icons and partner logos).
EOF
fi

echo "✅ تم تحديث المهارة في: $SKILL"
echo "— المرجع:      $SKILL/references/qudratak-progress-report.md"
echo "— الأدوات:      $SKILL/tools/dga_deck.py, $SKILL/tools/build_qudratak_report.py"
echo "— الأصول:       $SKILL/assets/qudratak/ ($(ls "$SKILL/assets/qudratak/media" | wc -l | tr -d ' ') ملفات وسائط)"
grep -c "qudratak-progress-report.md" "$SKILL/SKILL.md" >/dev/null && echo "— SKILL.md:     يشير إلى المرجع الجديد"
grep -q "Qudratak progress report add-on" "$CHANGELOG" && echo "— CHANGELOG.md: أُضيف إصدار v5.1"
