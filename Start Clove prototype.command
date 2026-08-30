#!/bin/zsh
# Starts the Clove prototype locally and opens it in the browser.
# Double-click this file. Stop it by closing the Terminal window (or Ctrl+C).

cd "$(dirname "$0")/clove-home" || exit 1

URL="http://localhost:4174/tiktok.html?start=1"

# already running? just open it
if curl -s -o /dev/null --max-time 1 "http://localhost:4174/"; then
  open "$URL"
  echo "Prototype already running: $URL"
  exit 0
fi

( sleep 1; open "$URL" ) &
echo "Serving the Clove prototype at $URL"
echo "Keep this window open while presenting. Ctrl+C to stop."
exec python3 -m http.server 4174
