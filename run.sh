#!/usr/bin/env bash

set -euo pipefail

CURDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT="${PORT:-20000}"

mkdir -p data

gtimeout 120 pnpm conc \
    --kill-others \
    --kill-signal SIGTERM \
    --kill-timeout 5000 \
    --prefix-colors auto \
    --names "gateway,service,client" \
    "cd '$CURDIR/gateway' && pnpm dev --port $PORT --inspector-port 0 --persist-to '$CURDIR/data'" \
    "cd '$CURDIR/service' && pnpm dev --port $((PORT + 1)) --inspector-port 0 --persist-to '$CURDIR/data'" \
    "sleep 2 && cd '$CURDIR/client' && pnpm tsx src/index.ts --url ws://localhost:$PORT/connect"
