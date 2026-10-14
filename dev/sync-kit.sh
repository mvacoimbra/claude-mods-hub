#!/bin/sh
# Copies the shared kit (kit/) into every mod of the pack, as hooks/kit/.
# Run from anywhere; the mods sit beside this repo in claude-mods/.
set -e
hub=$(cd "$(dirname "$0")/.." && pwd)
root=$(dirname "$hub")
for dir in \
  "$root/claude-skins" \
  "$root/cache-tax" \
  "$root/claude-code-filetree" \
  "$root/claude-kit/plugins/savvy-progress" \
  "$root/claude-code-playground/claude-code/mods/replay-theater" \
  "$root/claude-code-playground/claude-code/mods/blast-radius"
do
  if [ -d "$dir/hooks" ]; then
    mkdir -p "$dir/hooks/kit"
    cp "$hub"/kit/*.ts "$hub"/kit/*.tsx "$dir/hooks/kit/"
    echo "kit -> ${dir#$root/}/hooks/kit"
  fi
done
