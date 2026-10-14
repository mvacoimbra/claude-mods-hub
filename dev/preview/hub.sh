#!/bin/sh
# Captures the hub's views with stand-in mods and renders them to $1 (default /tmp/claude-501/preview).
set -e
out=${1:-/tmp/claude-501/preview}
cd "$(dirname "$0")/../.."
claude plugin test . 2>&1 | grep "@@PREVIEW" | sed 's/^@@PREVIEW //' | tail -1 > "$out/hub.cap.json"
node dev/preview/render.mjs "$out/hub.cap.json" "$out/hub.html" dark
