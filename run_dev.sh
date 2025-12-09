#!/usr/bin/env bash
set -euo pipefail

# Simple script to run uvicorn and ngrok for local development.
# It backgrounds the processes and tails their logs.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT_DIR/logs"

# Start uvicorn (serves the FastAPI app)
uvicorn back.main:app --reload --reload-dir back > "$ROOT_DIR/logs/uvicorn.log" 2>&1 &
echo $! > "$ROOT_DIR/.uvicorn.pid"

# Start ngrok tunnel to port 8000
ngrok http 8000 > "$ROOT_DIR/logs/ngrok.log" 2>&1 &
echo $! > "$ROOT_DIR/.ngrok.pid"

echo "Started uvicorn (pid $(cat $ROOT_DIR/.uvicorn.pid)) and ngrok (pid $(cat $ROOT_DIR/.ngrok.pid))."

tail -n +1 -f "$ROOT_DIR/logs/uvicorn.log" "$ROOT_DIR/logs/ngrok.log"
