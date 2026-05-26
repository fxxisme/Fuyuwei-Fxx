#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: sh enable-auth-websockets-basic.sh <auth-dir> [--dry-run] [--no-backup]" >&2
  exit 1
fi

AUTH_DIR=$1
DRY_RUN=0
NO_BACKUP=0
STAMP=$(date '+%Y%m%d-%H%M%S')

shift
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --no-backup) NO_BACKUP=1 ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

updated=0
would_update=0
unchanged=0
skipped=0
list_file="${TMPDIR:-/tmp}/enable-auth-websockets-files.$$"

trap 'rm -f "$list_file"' EXIT HUP INT TERM

find "$AUTH_DIR" -type f -name '*.json' > "$list_file"

while IFS= read -r file; do
  if ! grep -Eq '"websockets"[[:space:]]*:' "$file"; then
    if [ "$DRY_RUN" -eq 1 ]; then
      would_update=$((would_update + 1))
      echo "would_update: $file (add_websockets_field)"
      continue
    fi

    if [ "$NO_BACKUP" -eq 0 ]; then
      cp -p "$file" "$file.bak-$STAMP"
    fi

    tmp="$file.tmp.$$"
    awk '
      BEGIN { inserted = 0 }
      inserted == 0 && /\{/ {
        sub(/\{/, "{\n  \"websockets\": true,")
        inserted = 1
      }
      { print }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
    updated=$((updated + 1))
    echo "updated: $file (added_websockets_field)"
    continue
  fi

  if grep -Eq '"websockets"[[:space:]]*:[[:space:]]*true([[:space:],}])' "$file"; then
    unchanged=$((unchanged + 1))
    echo "unchanged: $file"
    continue
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    would_update=$((would_update + 1))
    echo "would_update: $file"
    continue
  fi

  if [ "$NO_BACKUP" -eq 0 ]; then
    cp -p "$file" "$file.bak-$STAMP"
  fi

  tmp="$file.tmp.$$"
  sed -E 's/"websockets"[[:space:]]*:[[:space:]]*(false|"false"|0|"0"|null)/"websockets": true/g' "$file" > "$tmp"
  mv "$tmp" "$file"
  updated=$((updated + 1))
  echo "updated: $file"
done < "$list_file"

echo "summary: updated=$updated would_update=$would_update unchanged=$unchanged skipped=$skipped"
