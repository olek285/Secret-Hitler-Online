#!/usr/bin/env bash
# Host Secret Hitler for phones on your Wi-Fi.
#
#   ./game-night.sh          build + start, open the QR code, keep the Mac awake
#   ./game-night.sh stop     stop the game server
#   ./game-night.sh logs     follow server logs
#
# Use another port if 80 is taken:  HOST_PORT=8080 ./game-night.sh
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE=(docker compose -f compose.gamenight.yml)
PORT="${HOST_PORT:-80}"

case "${1:-start}" in
  stop)
    "${COMPOSE[@]}" down
    exit 0
    ;;
  logs)
    exec "${COMPOSE[@]}" logs -f
    ;;
  start) ;;
  *)
    echo "Usage: $0 [start|stop|logs]" >&2
    exit 1
    ;;
esac

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running. Start Docker Desktop and try again." >&2
  exit 1
fi

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$IP" ]; then
  echo "Couldn't find this Mac's Wi-Fi address. Are you connected to Wi-Fi?" >&2
  exit 1
fi

if [ "$PORT" = "80" ]; then URL="http://$IP"; else URL="http://$IP:$PORT"; fi
export HOST_PORT="$PORT" PUBLIC_URL="$URL"

echo "Building and starting the game server (first build takes a few minutes)..."
"${COMPOSE[@]}" up -d --build

printf "Waiting for the server"
for _ in $(seq 1 90); do
  if curl -fs "http://localhost:$PORT/ping" >/dev/null 2>&1; then break; fi
  printf "."
  sleep 1
done
echo

if ! curl -fs "http://localhost:$PORT/ping" >/dev/null 2>&1; then
  echo "The server didn't come up. Check: $0 logs" >&2
  exit 1
fi

cat <<EOF

  Secret Hitler is running.

  Friends on your Wi-Fi open:  $URL
  (or scan the QR code on the page that just opened)

  Stop it later with:          $0 stop

EOF

open "http://localhost:$PORT" || true

echo "Keeping this Mac awake so the game doesn't drop (Ctrl+C to stop; the game keeps running)."
exec caffeinate -dis
