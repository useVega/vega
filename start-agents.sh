#!/bin/bash

echo "🚀 Starting Executive Discussion System"
echo "========================================"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
  echo "✓ Loaded environment variables from .env"
else
  echo "❌ .env file not found"
  exit 1
fi

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY not found in .env file"
  echo "Please add OPENAI_API_KEY to your .env file"
  exit 1
fi

echo "✓ OpenAI API Key detected"
echo ""

# Start agents in background
echo "Starting agents..."
echo ""

echo "🎯 Starting CEO Agent (port 3010)..."
bun run agents/ceo-agent.ts &
CEO_PID=$!
sleep 2

echo "💻 Starting CTO Agent (port 3011)..."
bun run agents/cto-agent.ts &
CTO_PID=$!
sleep 2

echo "📢 Starting CMO Agent (port 3012)..."
bun run agents/cmo-marketing-agent.ts &
CMO_PID=$!
sleep 2

echo "📝 Starting Summarizer Agent (port 3013)..."
bun run agents/summarizer-agent.ts &
SUMMARIZER_PID=$!
sleep 2

echo ""
echo "✅ All agents started!"
echo ""
echo "Agent PIDs:"
echo "  CEO: $CEO_PID"
echo "  CTO: $CTO_PID"
echo "  CMO: $CMO_PID"
echo "  Summarizer: $SUMMARIZER_PID"
echo ""
echo "Agent Endpoints:"
echo "  CEO:        http://localhost:3010"
echo "  CTO:        http://localhost:3011"
echo "  CMO:        http://localhost:3012"
echo "  Summarizer: http://localhost:3013"
echo ""
echo "Press Ctrl+C to stop all agents"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "Stopping all agents..."
  kill $CEO_PID $CTO_PID $CMO_PID $SUMMARIZER_PID 2>/dev/null
  echo "✅ All agents stopped"
  exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
