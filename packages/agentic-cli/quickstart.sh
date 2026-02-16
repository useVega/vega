#!/bin/bash

# Quick start script for Agentic CLI

echo "🚀 Agentic CLI Quick Start"
echo ""

# Build the CLI
echo "📦 Building CLI..."
cd "$(dirname "$0")"
bun run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build complete"
echo ""

# Make executable
chmod +x dist/index.js

# Create alias function
echo "💡 To use the CLI, you can:"
echo ""
echo "  1. Run directly:"
echo "     node dist/index.js <command>"
echo ""
echo "  2. Create an alias (add to ~/.zshrc or ~/.bashrc):"
echo "     alias agentic='node $(pwd)/dist/index.js'"
echo ""
echo "  3. Install globally:"
echo "     npm link"
echo ""

# Quick test
echo "🧪 Testing CLI..."
node dist/index.js --version

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ CLI is working!"
  echo ""
  echo "📚 Try these commands:"
  echo "  node dist/index.js --help"
  echo "  node dist/index.js init my-workflow"
  echo "  node dist/index.js list"
else
  echo "❌ CLI test failed"
  exit 1
fi
