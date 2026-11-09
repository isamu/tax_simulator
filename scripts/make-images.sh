#!/bin/sh
# Regenerates the favicon and the share images in public/. Needs ImageMagick and the Hiragino fonts (macOS).
set -eu
cd "$(dirname "$0")/../public"

ACCENT="#1f5ea8"
PAPER="#f7f5f0"
INK="#1d1c1a"
MUTED="#5d5a53"
BOLD="Hiragino-Sans-W6"
REGULAR="Hiragino-Sans-W3"

# iOS rounds the home screen icon itself and paints transparent corners black, so it gets radius 0.
icon() {
  magick -size "$1x$1" xc:none -fill "$ACCENT" \
    -draw "roundrectangle 0,0 $(($1 - 1)),$(($1 - 1)) $3,$3" \
    -font "$BOLD" -pointsize "$(($1 * 3 / 4))" -fill white -gravity center -annotate +0+0 "税" "$2"
}

share_image() {
  magick -size 1200x630 "xc:$PAPER" \
    -fill "$ACCENT" -draw "rectangle 0,0 1199,15" \
    -font "$BOLD" -pointsize 76 -fill "$INK" -gravity northwest -annotate +90+190 "$2" \
    -font "$REGULAR" -pointsize 36 -fill "$MUTED" -annotate +90+330 "$3" \
    -font "$BOLD" -pointsize 32 -fill "$ACCENT" -gravity southwest -annotate +90+70 "tax-answer.net" \
    "$1"
}

icon 512 icon-512.png 85
icon 180 apple-touch-icon.png 0
magick icon-512.png -define icon:auto-resize=48,32,16 favicon.ico
share_image og-image.png "税金シミュレーター" "年収から手取り・税金・社会保険料を計算（令和8年分）"
share_image furusato/og-image.png "ふるさと納税 上限計算" "個人事業主向け・確定申告書の順に入力（令和8年分）"
