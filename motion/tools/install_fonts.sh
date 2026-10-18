#!/bin/bash
# Fonts used by the frames (Kufam, Noto Kufi Arabic, Amiri) from the Google Fonts repository.
set -e; mkdir -p ~/.fonts; B=https://raw.githubusercontent.com/google/fonts/main/ofl
for f in "kufam/Kufam%5Bwght%5D.ttf:Kufam.ttf" "notokufiarabic/NotoKufiArabic%5Bwght%5D.ttf:NotoKufiArabic.ttf" "amiri/Amiri-Regular.ttf:Amiri-Regular.ttf" "amiri/Amiri-Bold.ttf:Amiri-Bold.ttf"; do
  [ -s ~/.fonts/${f##*:} ] || curl -sSL -o ~/.fonts/${f##*:} "$B/${f%%:*}"; done
fc-cache -f >/dev/null 2>&1; fc-list | grep -ci -E "kufam|NotoKufiArabic" | xargs echo "font files ready:"
