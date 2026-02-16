# Executive Product Discussion System

## 🎯 Overview

Three AI-powered executive agents (CEO, CTO, CMO) discuss and analyze product ideas using OpenAI GPT-4. Each agent brings their unique perspective:

- **🎯 CEO Agent** - Strategic business analysis, market opportunity, revenue models
- **💻 CTO Agent** - Technical feasibility, architecture, scalability, security
- **📢 CMO Agent** - Marketing strategy, positioning, customer acquisition

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install openai axios inquirer
```

### 2. Set OpenAI API Key

Already added to `.env`:
```env
OPENAI_API_KEY=your_key_here
```

### 3. Start the Agents

```bash
chmod +x start-agents.sh
./start-agents.sh
```

This will start all three agents on ports 3010, 3011, and 3012.

### 4. Run the Discussion

In a new terminal:

```bash
bun run run-executive-discussion.ts
```

Or use the CLI:

```bash
# Register the agents
cd packages/agentic-cli
node dist/index.js register ../../agent-definitions/ceo-agent.yaml
node dist/index.js register ../../agent-definitions/cto-agent.yaml
node dist/index.js register ../../agent-definitions/cmo-agent.yaml

# List registered agents
node dist/index.js list

# Run the workflow
node dist/index.js run ../../workflows/executive-discussion.yaml --inputs '{"productIdea":"AI-powered code review tool","rounds":2}'
```

## 📋 How It Works

### Discussion Flow

1. **User Input**: You provide a product idea
2. **Round 1**: Each executive gives their initial perspective
   - CEO analyzes business strategy and market
   - CTO evaluates technical feasibility
   - CMO develops marketing approach
3. **Round 2**: Executives respond to each other's insights
   - CEO refines strategy based on technical/marketing input
   - CTO adjusts architecture based on business/marketing needs
   - CMO adapts marketing based on business/technical constraints
4. **Summary**: Consolidated insights from all perspectives

### Agent Personalities

**CEO (Port 3010)**
- Focuses on: Strategy, ROI, Market Opportunity, Growth
- Questions: "Is this scalable?", "What's the business model?", "Who are our competitors?"
- Temperature: 0.8 (creative business thinking)

**CTO (Port 3011)**
- Focuses on: Architecture, Technology Stack, Security, Scalability
- Questions: "How do we build this?", "What's the tech complexity?", "How does it scale?"
- Temperature: 0.7 (balanced technical analysis)

**CMO (Port 3012)**
- Focuses on: Positioning, Target Audience, Go-to-Market, Branding
- Questions: "Who are our customers?", "How do we differentiate?", "What's our message?"
- Temperature: 0.8 (creative marketing thinking)

## 💡 Example Discussions

### Example 1: SaaS Product

```bash
bun run run-executive-discussion.ts
```

Input: "AI-powered code review tool for enterprise teams"

Expected Discussion:
- **CEO**: Market size, pricing model, competitor analysis (GitHub Copilot, etc.)
- **CTO**: AI/ML infrastructure, integration with Git, API design, scalability
- **CMO**: Target developer teams, freemium strategy, developer community engagement

### Example 2: Consumer App

Input: "Social fitness app that gamifies workouts with friends"

Expected Discussion:
- **CEO**: User acquisition costs, monetization (subscriptions vs ads), retention metrics
- **CTO**: Mobile app architecture, real-time sync, wearable integrations, backend scaling
- **CMO**: Gen Z targeting, influencer partnerships, viral growth loops, app store optimization

## 🔧 Manual Agent Control

### Start Individual Agents

```bash
# Terminal 1
bun run agents/ceo-agent.ts

# Terminal 2
bun run agents/cto-agent.ts

# Terminal 3
bun run agents/cmo-marketing-agent.ts
```

### Test Individual Agents

```bash
# CEO
curl -X POST http://localhost:3010/execute \
  -H "Content-Type: application/json" \
  -d '{"productIdea":"AI writing assistant"}'

# CTO
curl -X POST http://localhost:3011/execute \
  -H "Content-Type: application/json" \
  -d '{"productIdea":"AI writing assistant"}'

# CMO
curl -X POST http://localhost:3012/execute \
  -H "Content-Type: application/json" \
  -d '{"productIdea":"AI writing assistant"}'
```

### Health Checks

```bash
curl http://localhost:3010/health
curl http://localhost:3011/health
curl http://localhost:3012/health
```

## 📊 Advanced Usage

### Customize Discussion Rounds

Edit `run-executive-discussion.ts` to change the number of rounds or add more context.

### Add More Context

Modify agent system prompts in:
- `agents/ceo-agent.ts` - CEO_SYSTEM_PROMPT
- `agents/cto-agent.ts` - CTO_SYSTEM_PROMPT
- `agents/cmo-marketing-agent.ts` - CMO_SYSTEM_PROMPT

### Save Discussion Logs

Add to `run-executive-discussion.ts`:

```typescript
import { writeFileSync } from 'fs';

// After discussion
writeFileSync(
  `discussion-${Date.now()}.json`,
  JSON.stringify(discussion, null, 2)
);
```

## 🎨 CLI Integration

The agents are already registered in the CLI. Use:

```bash
cd packages/agentic-cli

# List all agents
node dist/index.js list --tags executive

# Run workflow
node dist/index.js run ../../workflows/executive-discussion.yaml \
  --inputs '{"productIdea":"Your product idea here","rounds":3}' \
  --verbose
```

## 🔒 Security Notes

- OpenAI API key is used for GPT-4 calls
- Each agent call costs ~$0.01-0.03 depending on response length
- No data is stored permanently (stateless agents)
- All communication is local (agents on localhost)

## 🐛 Troubleshooting

### "Agent not running" error

Make sure all agents are started:
```bash
./start-agents.sh
```

### OpenAI API errors

Check your API key in `.env`:
```bash
echo $OPENAI_API_KEY
```

### Port conflicts

Change ports in `.env`:
```env
CEO_AGENT_PORT=3010
CTO_AGENT_PORT=3011
CMO_AGENT_PORT=3012
```

## 📈 Next Steps

1. **Add Memory**: Store previous discussions for context
2. **Add Voting**: Agents vote on best approach
3. **Add Facilitator**: 4th agent that moderates discussion
4. **Add Documents**: Upload business docs for context
5. **Add Real-time UI**: Web interface to watch discussion live

---

**Ready to discuss your product idea with AI executives!** 🚀
