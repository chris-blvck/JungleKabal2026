#!/bin/bash
# Download all game assets from postimg.cc and organize by category

BASE="https://i.postimg.cc"
OUT="/home/user/JungleKabal2026/public/game-assets"

dl() {
  local url="$1"
  local dest="$2"
  local fname=$(basename "$url" | sed 's/[^a-zA-Z0-9._-]/-/g')
  local full_dest="$dest/$fname"
  if [ -f "$full_dest" ]; then
    echo "  [skip] $fname"
  else
    echo "  [dl]   $fname"
    curl -sL --max-time 15 -A "Mozilla/5.0" -o "$full_dest" "$url" || echo "  [FAIL] $url"
    sleep 0.3
  fi
}

echo "=== DICE ==="
dl "$BASE/mk4Rdw2K/Dice-1.png"         "$OUT/dice"
dl "$BASE/NFtYN4jq/Dice-2.png"         "$OUT/dice"
dl "$BASE/4yGZ85xs/Dice-3.png"         "$OUT/dice"
dl "$BASE/qqr0mLvJ/Dice-4.png"         "$OUT/dice"
dl "$BASE/x8QYsR1j/Dice-5.png"         "$OUT/dice"
dl "$BASE/gjpdMD2J/Dice-6.png"         "$OUT/dice"
dl "$BASE/k4T1QSqL/Dice-health-1.png"  "$OUT/dice"
dl "$BASE/hvhCpGGd/Dice-Health-2.png"  "$OUT/dice"
dl "$BASE/BbthMvv1/Dice-Health-3.png"  "$OUT/dice"
dl "$BASE/QCV60MM1/Dice-Health-4.png"  "$OUT/dice"
dl "$BASE/brd63vv3/Dice-Helath-5.png"  "$OUT/dice"
dl "$BASE/mkhd8rr1/Dice-Health-6.png"  "$OUT/dice"
dl "$BASE/x8qstddp/Dice-shield-1.png"  "$OUT/dice"
dl "$BASE/Zngwgh9P/Dice-Shield-2.png"  "$OUT/dice"
dl "$BASE/L57x7Mq3/Dice-Shield-4.png"  "$OUT/dice"
dl "$BASE/mkqmqGcp/Dice-Shield-5.png"  "$OUT/dice"
dl "$BASE/90SLSj4K/Dice-Shield-6.png"  "$OUT/dice"

echo "=== MONSTERS / ENEMIES ==="
dl "$BASE/MHWQR1RF/Water-Eel.png"       "$OUT/monsters"
dl "$BASE/prtBS9jQ/River-Scum.png"      "$OUT/monsters"
dl "$BASE/Y0gsGK6R/Yeti-1.png"          "$OUT/monsters"
dl "$BASE/Kjv2tYYn/Carnivorous-4.png"   "$OUT/monsters"
dl "$BASE/XYDpJTQK/Magic-Book-1.png"    "$OUT/monsters"
dl "$BASE/0Q3R0ZLZ/K-Rex.png"           "$OUT/monsters"
dl "$BASE/Bb8hWWY7/Lok-Ness-2.png"      "$OUT/monsters"
dl "$BASE/nz9dgbw2/Water-Monster-1.png" "$OUT/monsters"
dl "$BASE/B6J9Gv2n/Ghost-Yellow.png"    "$OUT/monsters"
dl "$BASE/qMwGmvv2/Carnivor-tree-5.png" "$OUT/monsters"
dl "$BASE/MTYWSgrx/jade-toxic-hydra.png" "$OUT/monsters"
dl "$BASE/43B4T88f/Torlin.jpg"          "$OUT/monsters"
dl "$BASE/R0ndk8Cd/Mr-Carrillo.jpg"     "$OUT/monsters"

echo "=== COMPANIONS ==="
dl "$BASE/5Ns6vQgw/amber-grove-sproutling.png" "$OUT/companions"
dl "$BASE/gjftB2qh/jade-toxic-imp.png"          "$OUT/companions"
dl "$BASE/rp344R8S/coral-jungle-shaman.png"     "$OUT/companions"
dl "$BASE/nrswkD7p/jade-spirit-hoarder.png"     "$OUT/companions"
dl "$BASE/kXvWH5yw/olive-toxic-gazer.png"       "$OUT/companions"
dl "$BASE/2SCgpVNZ/golden-jungle-watcher.png"   "$OUT/companions"
dl "$BASE/mkGFXx1g/chartreuse-swamp-sprite.png" "$OUT/companions"
dl "$BASE/jSvmRtRF/golden-toxic-totem.png"      "$OUT/companions"
dl "$BASE/JnH23XZg/verdant-bone-wreath.png"     "$OUT/companions"
dl "$BASE/ZRvMPNpM/golden-venom-serpent.png"    "$OUT/companions"
dl "$BASE/JzKvRMRK/golden-light-pods.png"       "$OUT/companions"
dl "$BASE/g24QGmGB/golden-spirit-lantern.png"   "$OUT/companions"
dl "$BASE/mD1539C6/golden-verdant-totem.png"    "$OUT/companions"

echo "=== CHARACTERS ==="
dl "$BASE/B6rBLmBt/Kabalian-Face.png"          "$OUT/characters"
dl "$BASE/Kv8zygVk/KKM-Mascot-2.png"           "$OUT/characters"
dl "$BASE/c4BM7sg5/Kabalian-Chosen-one.png"    "$OUT/characters"
dl "$BASE/7PRxV34n/kkm-eazy-moni-transparent.png" "$OUT/characters"
dl "$BASE/DwMdGXHm/Kabalian-or-KKM.png"        "$OUT/characters"

echo "=== BACKGROUNDS ==="
dl "$BASE/YSmfqq2c/Background-desktop.png"     "$OUT/backgrounds"
dl "$BASE/4yfhQzR0/backgroudn-website.png"     "$OUT/backgrounds"

echo "=== LOGOS ==="
dl "$BASE/7YwD758t/Logo-JK-Transparent-full.png"    "$OUT/logos"
dl "$BASE/d0vVYTyf/Logo-JK-Transparent-full.png"    "$OUT/logos"
dl "$BASE/qvwCbYc2/Logo-JK-Transparent-full.png"    "$OUT/logos"
dl "$BASE/bwvhC4v2/logo-jaune-rond.png"             "$OUT/logos"
dl "$BASE/fTGb8PWH/logo-jaune-rond.png"             "$OUT/logos"
dl "$BASE/hPqzSgpC/logo-jaune-rond.png"             "$OUT/logos"
dl "$BASE/rwdjP9rb/logo-jaune.png"                  "$OUT/logos"
dl "$BASE/sD42KF0v/Logo-Eye-Hologram-Transparent.png" "$OUT/logos"
dl "$BASE/Tw5kkF5b/Kabal-Flag-V2.png"               "$OUT/logos"
dl "$BASE/sfYcPc5f/Kabal-Scouting-v2.png"           "$OUT/logos"

echo "=== UI / MISC ==="
dl "$BASE/XJxBYQrg/divider-liane.png"   "$OUT/ui"
dl "$BASE/mkJDPqB1/divider-2.png"       "$OUT/ui"
dl "$BASE/nzF5PPfy/Drums.png"           "$OUT/ui"
dl "$BASE/0NmGWwZc/longlife.jpg"        "$OUT/ui"

echo "=== DONE ==="
find "$OUT" -type f | wc -l
echo "files downloaded"
