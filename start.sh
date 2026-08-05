#!/bin/bash
cd /Users/eldonkraushar/Workspace/inventory_listing_generator
source $HOME/.local/bin/env
export APP_PORT=${APP_PORT:-3000}
uv run uvicorn backend.app.main:app --host 0.0.0.0 --port $APP_PORT --reload
