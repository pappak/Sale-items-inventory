#!/bin/bash
set -e
cd "$(dirname "$0")"

export APP_PORT=${APP_PORT:-3001}
export BACKEND_PORT=$((${APP_PORT:-3001} + 100))

if [ -f /usr/local/lib/workshop-devguard.sh ]; then
    source /usr/local/lib/workshop-devguard.sh
    devguard_acquire "$APP_PORT" "$BACKEND_PORT"
fi

# Start backend
uv run uvicorn backend.app.main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Start frontend
cd frontend
npm install --silent
npx vite --port "$APP_PORT" --strictPort &
FRONTEND_PID=$!

cd ..

# Wait for either to exit
wait $BACKEND_PID $FRONTEND_PID
