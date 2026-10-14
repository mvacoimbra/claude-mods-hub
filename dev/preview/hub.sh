#!/bin/sh
# Draws the hub with every mod's exported hub data and screenshots each view into $1
# (default /tmp/claude-501/preview): hub-<view>.png.
set -e
out=${1:-/tmp/claude-501/preview}
here=$(cd "$(dirname "$0")" && pwd)
python3 "$here/fixtures.py"
cd "$here/../.."
claude plugin test . 2>&1 | grep "@@PREVIEW" | sed 's/^@@PREVIEW //' | tail -1 > "$out/hub.cap.json"
python3 - "$out" "$here" <<'PY'
import json, subprocess, sys
out, here = sys.argv[1], sys.argv[2]
cap = json.load(open(f'{out}/hub.cap.json'))
for item in cap['sections'][0]['items']:
    name = f"hub-{item['label']}"
    json.dump({'title': item['label'], 'sections': [{'title': '', 'items': [item]}]}, open(f'{out}/{name}.cap.json', 'w'))
    subprocess.run(['node', f'{here}/render.mjs', f'{out}/{name}.cap.json', f'{out}/{name}.html'], check=True, capture_output=True)
    subprocess.run(['sh', f'{here}/shot.sh', f'{out}/{name}.html', f'{out}/{name}.png', '560', '3200'], check=True, capture_output=True)
    print(f'{out}/{name}.png')
PY
