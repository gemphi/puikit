#!/usr/bin/env bash
# On the server: copy a collection's finished renders straight from Google Drive and make the media store's pictures
# from them, so no zip passes through anyone's Downloads.
#   scripts/media/drive-pull.sh epac            every render of the collection (drive-map.json: collections.epac.images)
#   scripts/media/drive-pull.sh epac 16         only the first 16, to try it
#   scripts/media/drive-pull.sh bold-pups BPSC  a club's folder (collections.bold-pups.clubs.BPSC)
# Needs rclone with a Drive remote named `gdrive` (once: scripts/media/drive-link.ps1 on your PC) and cwebp.
# Renders land in $INCOMING/<slug>/ (kept, so a second run copies only what is new); pictures in
# $CDN/collections/<slug>/images/<00001>.webp, 768px, quality 80, as import_collections.py makes them.
set -euo pipefail

slug="${1:?usage: drive-pull.sh <collection> [first-n | club]}"
arg="${2:-}"
here="$(cd "$(dirname "$0")" && pwd)"
INCOMING="${INCOMING:-/srv/phi-incoming}"
CDN="${CDN:-/srv/phi-cdn}"
SIDE="${SIDE:-768}"

# The Drive folder's id, and the shared drive it is on, from drive-map.json.
read -r folder drive < <(python3 - "$here/drive-map.json" "$slug" "$arg" <<'EOF'
import json, sys
m = json.load(open(sys.argv[1])); c = m['collections'][sys.argv[2]]; arg = sys.argv[3]
src = c['clubs'][arg] if arg and not arg.isdigit() and 'clubs' in c else c['images']
print(src['id'], m.get('sharedDrive', ''))
EOF
)

raw="$INCOMING/$slug"; out="$CDN/collections/$slug/images"
sudo mkdir -p "$raw" "$out"; sudo chown "$USER" "$raw"

limit=()
if [[ "$arg" =~ ^[0-9]+$ ]]; then
  # The first N files by name (EPAC-0001.png ... ), for a trial run.
  rclone lsf "gdrive:" --drive-root-folder-id "$folder" ${drive:+--drive-team-drive "$drive"} --files-only \
    | sort | head -n "$arg" > "$raw/.first"
  limit=(--files-from "$raw/.first")
fi

echo "copying Drive folder $folder into $raw"
rclone copy "gdrive:" "$raw" --drive-root-folder-id "$folder" ${drive:+--drive-team-drive "$drive"} \
  --include '*.png' "${limit[@]}" --transfers 4 --checkers 8 --stats 30s --stats-one-line

made=0
for f in "$raw"/*.png; do
  [ -e "$f" ] || continue
  # The token is the file name's last number (EPAC-0001.png, BPSC-0001.png, 00001.png), five digits wide.
  n="$(basename "$f" .png | grep -oE '[0-9]+$' || true)"; [ -n "$n" ] || continue
  t="$out/$(printf '%05d' "$((10#$n))").webp"
  [ -s "$t" ] && [ "$t" -nt "$f" ] && continue
  cwebp -quiet -q 80 -m 4 -resize "$SIDE" 0 "$f" -o "/tmp/drive-pull.webp" && sudo install -m 644 /tmp/drive-pull.webp "$t"
  made=$((made + 1))
done
sudo chmod -R a+rX "$CDN/collections/$slug"
echo "$slug: $made pictures made; $(ls "$out" | wc -l) in $out"
