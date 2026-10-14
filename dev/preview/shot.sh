#!/bin/sh
# Screenshots a preview page with headless Chrome: shot.sh <page.html> <out.png> [width] [height]
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size="${3:-1100},${4:-2400}" --screenshot="$2" "file://$1" >/dev/null 2>&1
echo "$2"
