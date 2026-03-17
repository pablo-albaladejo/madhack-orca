#!/bin/bash
# Start all three components for the Weekend Escape Planner

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting Weekend Escape Planner..."
echo ""

# Check .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "❌ Missing .env file. Copy .env.example to .env and fill in your API keys."
  exit 1
fi

# Start provider (background)
echo "📦 Starting Provider Agent (port 3000)..."
cd "$SCRIPT_DIR/provider-agent"
npm run dev &
PROVIDER_PID=$!

# Wait for provider to be ready
echo "   Waiting for provider..."
for i in $(seq 1 15); do
  if curl -s http://localhost:3000/.well-known/agent-card.json > /dev/null 2>&1; then
    echo "   ✅ Provider ready"
    break
  fi
  sleep 1
done

# Start consumer (background)
echo "🧠 Starting Consumer Agent (port 8000)..."
cd "$SCRIPT_DIR/consumer-agent"
source .venv/bin/activate 2>/dev/null || true
python main.py &
CONSUMER_PID=$!

# Wait for consumer
echo "   Waiting for consumer..."
for i in $(seq 1 10); do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Consumer ready"
    break
  fi
  sleep 1
done

# Start chat UI (foreground)
echo "💬 Starting Chat UI (port 8501)..."
cd "$SCRIPT_DIR/chat-ui"
pip install -q -r requirements.txt 2>/dev/null
streamlit run app.py --server.port 8501 --server.headless true &
UI_PID=$!

echo ""
echo "═══════════════════════════════════════"
echo "  Weekend Escape Planner is running!"
echo "═══════════════════════════════════════"
echo ""
echo "  🌐 Chat UI:    http://localhost:8501"
echo "  🧠 Consumer:   http://localhost:8000"
echo "  📦 Provider:   http://localhost:3000"
echo "  📋 Agent Card: http://localhost:3000/.well-known/agent-card.json"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to kill all background processes
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $PROVIDER_PID $CONSUMER_PID $UI_PID 2>/dev/null
  wait $PROVIDER_PID $CONSUMER_PID $UI_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Wait for any process to exit
wait
