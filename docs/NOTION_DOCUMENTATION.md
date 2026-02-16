# 🌟 Vega Protocol

> A multi-agent workflow platform enabling developers to create, publish, and monetize AI agents with built-in payment rails and trust infrastructure.

---

# 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [Workflow System](#workflow-system)
7. [Agent Registry](#agent-registry)
8. [Payment System](#payment-system)
9. [Frontend Integration](#frontend-integration)
10. [CLI Reference](#cli-reference)
11. [API Reference](#api-reference)
12. [Examples](#examples)
13. [FAQs](#faqs)
14. [Roadmap](#roadmap)

---

# 🎯 Overview

## What is Vega Protocol?

Vega Protocol is a **platform for building, deploying, and monetizing multi-agent AI systems** without the complexity of infrastructure, payment integration, or agent discovery.

## The Problem It Solves

| Challenge | Traditional Approach | Vega Protocol |
|-----------|---------------------|---------------|
| **Orchestration** | 500+ lines of code | 20 lines of YAML |
| **Agent Discovery** | Manual research, rebuild | Searchable registry |
| **Payments** | 3-4 weeks integration | Built-in x402 |
| **Frontend Dev** | Build custom APIs | Type-safe SDK |
| **Trust** | No verification | ERC-8004 identity |

## Key Features

### ✨ **Declarative YAML Workflows**
Define complex multi-agent workflows in simple YAML syntax

### 🏪 **Agent Marketplace**
Discover, publish, and monetize AI agents

### 💰 **Built-in Payment Rails**
Automatic USDC payments on Base via x402 protocol

### 🔐 **Trust & Identity**
ERC-8004 agent identity with reputation tracking

### 🎨 **Type-Safe Frontend SDK**
Framework-agnostic client for React, Vue, Angular

### ⚡ **Zero Infrastructure**
No servers, no DevOps, just workflows

---

# ⚡ Quick Start

## Installation

```bash
# Install CLI globally
npm install -g @agentic-eco/cli

# Or use with npx
npx @agentic-eco/cli --help
```

## Your First Workflow (3 minutes)

### Step 1: Create a Workflow

```yaml
# my-first-workflow.yaml
name: text-processing-pipeline
version: 1.0.0
chain: base
maxBudget: 1.0
budgetToken: USDC

inputs:
  message:
    type: string
    required: true

nodes:
  - id: echo
    ref: echo-agent
    inputs:
      text: "{{inputs.message}}"
  
  - id: transform
    ref: text-transformer
    inputs:
      text: "{{echo.output.text}}"
      operation: uppercase

edges:
  - from: echo
    to: transform

outputs:
  result:
    value: "{{transform.output.transformed}}"
```

### Step 2: Execute

```bash
agentic-cli run my-first-workflow.yaml \
  --inputs '{"message":"Hello Vega!"}'
```

### Step 3: See Results

```
✓ Workflow completed!

┌──────────┬───────────┬──────────┐
│ Node     │ Status    │ Duration │
├──────────┼───────────┼──────────┤
│ echo     │ ✓ Success │ 234ms    │
│ transform│ ✓ Success │ 156ms    │
└──────────┴───────────┴──────────┘

Output: HELLO VEGA!
```

---

# 💡 Core Concepts

## Agents

**Agents** are autonomous AI services that perform specific tasks.

### Agent Properties

- **Identity**: Unique ID and metadata
- **Capabilities**: What the agent can do
- **Pricing**: Cost per execution (USDC)
- **Endpoints**: HTTP URLs for invocation
- **Chains**: Supported blockchains
- **Reputation**: Trust score (coming soon)

### Agent Categories

| Category | Examples | Use Cases |
|----------|----------|-----------|
| **Text Processing** | Summarizer, Translator | Content workflows |
| **Data Analysis** | Analyzer, Visualizer | Reports, insights |
| **Code** | Reviewer, Generator | Dev automation |
| **Media** | Image Gen, Video Edit | Content creation |
| **Web3** | Oracle, DeFi Agent | Blockchain ops |

## Workflows

**Workflows** are directed acyclic graphs (DAGs) of agent executions.

### Workflow Components

```
┌─────────────────────────────────────┐
│           WORKFLOW                  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐      ┌─────┐      ┌─────┐│
│  │Node │─────▶│Node │─────▶│Node ││
│  │  A  │      │  B  │      │  C  ││
│  └─────┘      └─────┘      └─────┘│
│     ▲            │            ▼    │
│     │            ▼         ┌─────┐│
│  Inputs       Edges        Output ││
│                            └─────┘│
└─────────────────────────────────────┘
```

### Node Structure

```yaml
nodes:
  - id: unique-node-id        # Identifier
    ref: agent-id             # Agent from registry
    name: Human Name          # Display name
    inputs:                   # Input mapping
      param1: "{{value}}"
    retry:                    # Retry policy
      maxAttempts: 3
      backoffMs: 1000
    depends: [node1, node2]   # Dependencies
```

## Template Variables

Pass data between nodes using `{{variable}}` syntax:

```yaml
nodes:
  - id: step1
    inputs: { text: "{{inputs.message}}" }    # From workflow input
  
  - id: step2
    inputs: { text: "{{step1.output.result}}" }  # From previous node
  
  - id: step3
    inputs: { 
      combined: "{{step1.output.a}} and {{step2.output.b}}"  # Multiple refs
    }
```

## Payments

### Budget Flow

```
1. User Reserves Budget
         ▼
2. Workflow Starts
         ▼
3. Each Agent Gets Paid on Completion
         ▼
4. Unused Budget Refunded
```

### Payment Features

- ✅ **Escrow**: Funds reserved upfront
- ✅ **Pay-per-use**: Only pay for completed work
- ✅ **Auto-refund**: Unused budget returned
- ✅ **On-chain**: USDC on Base/Base Sepolia
- ✅ **Multi-token**: USDC, USDT (more coming)

---

# 🏗️ Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VEGA PROTOCOL                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Frontend   │   │   CLI Tool   │   │   Backend    │
│              │   │              │   │   Services   │
│ • React UI   │   │ • Commands   │   │              │
│ • Vue App    │   │ • Scripts    │   │ • Registry   │
│ • Angular    │   │ • Automation │   │ • Execution  │
└──────────────┘   └──────────────┘   │ • Payments   │
        │                   │          └──────────────┘
        └───────────────────┼───────────────────┘
                            ▼
                ┌───────────────────────┐
                │  Core Infrastructure  │
                ├───────────────────────┤
                │ • Agent Registry      │
                │ • Workflow Engine     │
                │ • Payment System      │
                │ • A2A Protocol        │
                │ • x402 Middleware     │
                └───────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Agents     │   │  Blockchain  │   │   Storage    │
│              │   │              │   │              │
│ • HTTP APIs  │   │ • Base       │   │ • YAML Specs │
│ • A2A Proto  │   │ • Arbitrum   │   │ • Metadata   │
│ • Custom     │   │ • Optimism   │   │ • Logs       │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Module Breakdown

### 1️⃣ **Agent Registry** (`src/registry/`)

Manages agent definitions and discovery

**Features:**
- CRUD operations for agents
- Category-based search
- Price filtering
- Chain compatibility
- Status management (active/deprecated)

**Key Types:**
```typescript
interface AgentDefinition {
  id: string;
  name: string;
  category: AgentCategory;
  pricing: { perExecution: string };
  endpoints: { execute: string };
  chains: ChainType[];
  status: 'active' | 'deprecated';
}
```

### 2️⃣ **Workflow System** (`src/workflow/`)

Parses, validates, and schedules workflows

**Components:**
- **YAML Parser**: Converts YAML → WorkflowSpec
- **Validator**: Graph validation, cycle detection
- **Scheduler**: Queue management, execution ordering

**Validation Checks:**
- ✅ Syntax validation
- ✅ Circular dependency detection
- ✅ Agent reference verification
- ✅ Budget sufficiency
- ✅ Input/output mapping

### 3️⃣ **Execution Engine** (`src/execution/`)

Orchestrates workflow execution

**Features:**
- Dependency resolution
- Parallel execution
- Retry logic
- Error handling
- Progress tracking
- A2A protocol communication

**Execution Flow:**
```
Parse → Validate → Schedule → Execute → Monitor → Complete
```

### 4️⃣ **Payment Layer** (`src/payment/`)

Handles all payment operations

**Components:**
- **Budget Manager**: Reserve/release funds
- **x402 Middleware**: Payment verification
- **Settlement Service**: On-chain transfers

**Payment Workflow:**
```typescript
1. reserveBudget(userId, amount)
2. executeWorkflow()
3. payAgent(agentId, amount) × N
4. settleReservation(remainingBudget)
```

### 5️⃣ **Frontend SDK** (`src/frontend/`)

Type-safe client for frontend apps

**Clients:**
- **WorkflowClient**: Execute, monitor, manage
- **AgentClient**: Search, create, publish
- **PaymentClient**: Budget operations

```typescript
const client = new AgenticClient({ apiUrl: '...' });
await client.workflows.execute({ yaml, userId, inputs });
```

---

# 🚀 Getting Started

## Prerequisites

- **Node.js**: 18+ or Bun runtime
- **Wallet**: Ethereum-compatible (MetaMask, etc.)
- **Funds**: USDC on Base Sepolia (testnet) or Base (mainnet)

## Installation Options

### Option 1: Global CLI

```bash
npm install -g @agentic-eco/cli
agentic-cli --version
```

### Option 2: Project Dependency

```bash
npm install @agentic-eco/client
```

### Option 3: Use with npx

```bash
npx @agentic-eco/cli run workflow.yaml
```

## Configuration

Create `.env` file:

```bash
# API Configuration
VEGA_API_URL=https://api.vega.com
VEGA_API_KEY=your_api_key_here

# Blockchain Configuration
DEFAULT_CHAIN=base-sepolia
DEFAULT_TOKEN=USDC

# Wallet Configuration
USER_WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...  # Only for CLI automation

# RPC Endpoints
BASE_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Payment Configuration
PAYMENT_GATEWAY_URL=https://payments.vega.com
```

---

# 📝 Workflow System

## YAML Syntax Reference

### Complete Workflow Structure

```yaml
# Metadata
name: workflow-name
version: 1.0.0
description: What this workflow does
chain: base
maxBudget: 10.0
budgetToken: USDC

# Input Schema
inputs:
  paramName:
    type: string | number | boolean | object
    description: Parameter description
    required: true | false
    default: defaultValue

# Output Schema
outputs:
  resultName:
    type: string
    description: Output description
    value: "{{node.output.field}}"

# Execution Nodes
nodes:
  - id: unique-id
    ref: agent-id-from-registry
    name: Display Name
    description: What this node does
    inputs:
      param: "{{inputs.value}}"
    retry:
      maxAttempts: 3
      backoffMs: 1000
    depends: [parent-node-1, parent-node-2]

# Execution Graph
edges:
  - from: source-node-id
    to: target-node-id
    condition: "{{source.status}} === 'success'"

# Metadata
metadata:
  author: your-name
  tags: [tag1, tag2]
  estimatedCost: 0.50
  estimatedDuration: 500ms
```

## Workflow Patterns

### Pattern 1: Linear Pipeline

```yaml
# A → B → C
edges:
  - from: nodeA
    to: nodeB
  - from: nodeB
    to: nodeC
```

```
┌─────┐    ┌─────┐    ┌─────┐
│  A  │───▶│  B  │───▶│  C  │
└─────┘    └─────┘    └─────┘
```

### Pattern 2: Parallel Execution

```yaml
# A → [B, C, D] → E
edges:
  - from: nodeA
    to: [nodeB, nodeC, nodeD]
  - from: nodeB
    to: nodeE
  - from: nodeC
    to: nodeE
  - from: nodeD
    to: nodeE
```

```
        ┌─────┐
    ┌──▶│  B  │──┐
    │   └─────┘  │
┌─────┐         ┌─────┐
│  A  │         │  E  │
└─────┘         └─────┘
    │   ┌─────┐  │
    ├──▶│  C  │──┤
    │   └─────┘  │
    │   ┌─────┐  │
    └──▶│  D  │──┘
        └─────┘
```

### Pattern 3: Conditional Branching

```yaml
edges:
  - from: nodeA
    to: nodeB
    condition: "{{nodeA.output.success}} === true"
  - from: nodeA
    to: nodeC
    condition: "{{nodeA.output.success}} === false"
```

```
┌─────┐    Success    ┌─────┐
│  A  │──────────────▶│  B  │
└─────┘               └─────┘
   │
   │ Failure
   │
   └───────────────▶┌─────┐
                    │  C  │
                    └─────┘
```

### Pattern 4: Fan-out, Fan-in

```yaml
# Process items in parallel, then aggregate
edges:
  - from: splitter
    to: [worker1, worker2, worker3]
  - from: [worker1, worker2, worker3]
    to: aggregator
```

## Best Practices

### ✅ DO

- Use descriptive node IDs (`ceo_analysis` not `node1`)
- Set appropriate retry policies
- Define clear input/output schemas
- Add metadata for documentation
- Test workflows before production
- Keep workflows focused (< 10 nodes)

### ❌ DON'T

- Create circular dependencies
- Use hardcoded values (use inputs)
- Skip error handling
- Omit budget limits
- Chain too many agents (> 15)
- Ignore validation warnings

---

# 🏪 Agent Registry

## Browsing Agents

### CLI Search

```bash
# Search by category
agentic-cli agents search --category="text-processing"

# Filter by price
agentic-cli agents search --max-price=0.50

# Search by keyword
agentic-cli agents search --keyword="summarize"

# Combine filters
agentic-cli agents search \
  --category="data-analysis" \
  --chain="base" \
  --max-price=1.0 \
  --tags="python,pandas"
```

### Programmatic Search

```typescript
import { AgenticClient } from '@agentic-eco/client';

const client = new AgenticClient({ apiUrl: 'https://api.vega.com' });

// Search agents
const agents = await client.agents.search({
  category: 'text-processing',
  maxPrice: 0.50,
  chain: 'base',
  tags: ['nlp', 'summarization']
});

// Get specific agent
const agent = await client.agents.getById('text-transformer');

console.log(agent.name);        // "Text Transformer"
console.log(agent.pricing);     // { perExecution: "0.15" }
console.log(agent.capabilities); // ["uppercase", "lowercase", ...]
```

## Creating Agents

### Agent Definition File

```yaml
# agent-definition.yaml
name: My Custom Agent
description: Does amazing things
category: text-processing
version: 1.0.0

# Pricing
pricing:
  perExecution: "0.25"
  currency: USDC

# Endpoints
endpoints:
  execute: https://my-agent.com/execute
  cancel: https://my-agent.com/cancel/:taskId
  health: https://my-agent.com/health

# Capabilities
capabilities:
  - name: process
    description: Process text input
    inputSchema:
      type: object
      properties:
        text: { type: string }
    outputSchema:
      type: object
      properties:
        result: { type: string }

# Blockchain Support
chains: [base, base-sepolia]
tokens: [USDC, USDT]

# Metadata
tags: [nlp, text, processing]
author: your-name
website: https://example.com
```

### Register Agent

```bash
# Via CLI
agentic-cli agents register agent-definition.yaml

# Via API
const agent = await client.agents.create({
  name: 'My Custom Agent',
  category: 'text-processing',
  pricing: { perExecution: '0.25' },
  // ... other fields
});
```

## Publishing Agents

```bash
# Publish agent
agentic-cli agents publish agent-id

# Unpublish agent
agentic-cli agents unpublish agent-id

# Update agent
agentic-cli agents update agent-id agent-definition.yaml

# Delete agent
agentic-cli agents delete agent-id
```

## Agent Categories

| Category | Description | Example Agents |
|----------|-------------|----------------|
| `text-processing` | Text manipulation | Summarizer, Translator |
| `data-analysis` | Data processing | Analyzer, Visualizer |
| `code` | Code operations | Reviewer, Generator |
| `media` | Media processing | Image Gen, Video Edit |
| `web3` | Blockchain ops | Oracle, DeFi Agent |
| `automation` | Workflow automation | Scheduler, Integrator |
| `ml` | Machine learning | Classifier, Predictor |
| `other` | Everything else | Custom agents |

---

# 💰 Payment System

## Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   PAYMENT LIFECYCLE                          │
└──────────────────────────────────────────────────────────────┘

1. User Adds Funds
   └─▶ deposit(userId, amount, token)
        │
        ▼
2. Reserve Budget for Workflow
   └─▶ reserveBudget(userId, workflowCost)
        │
        ▼
3. Execute Workflow
   └─▶ For each node:
        ├─▶ Execute agent
        ├─▶ On success: payAgent(agentId, price)
        └─▶ On failure: skip payment
        │
        ▼
4. Settle Reservation
   └─▶ settleReservation(reservationId)
        ├─▶ Calculate unused = reserved - spent
        └─▶ Refund unused to user
```

## Budget Management

### Check Balance

```typescript
// Get user budget
const budget = await client.payments.getUserBudget('user123');

console.log(budget);
// {
//   available: "10.50",
//   reserved: "2.00",
//   spent: "5.25",
//   token: "USDC",
//   chain: "base"
// }
```

### Add Funds

```typescript
// Add USDC to user balance
await client.payments.addFunds({
  userId: 'user123',
  amount: '50.00',
  token: 'USDC',
  txHash: '0x...'  // On-chain transaction hash
});
```

### Reserve & Release

```typescript
// Reserve budget for workflow
const reservationId = await client.payments.reserveBudget({
  userId: 'user123',
  amount: '2.50',
  token: 'USDC'
});

// Execute workflow...

// Release unused budget
await client.payments.releaseReservation(reservationId);
```

## Pricing Strategies

### Fixed Price

```yaml
pricing:
  perExecution: "0.50"  # Fixed $0.50 per execution
```

### Dynamic Pricing

```typescript
// Agent calculates price based on input
pricing: {
  model: 'dynamic',
  calculator: (input) => {
    const wordCount = input.text.split(' ').length;
    return (wordCount / 100) * 0.10;  // $0.10 per 100 words
  }
}
```

### Tiered Pricing

```yaml
pricing:
  tiers:
    - maxUnits: 100
      pricePerUnit: "0.50"
    - maxUnits: 1000
      pricePerUnit: "0.30"
    - maxUnits: Infinity
      pricePerUnit: "0.20"
```

## Supported Tokens

| Token | Chains | Decimals | Contract |
|-------|--------|----------|----------|
| **USDC** | Base, Base Sepolia | 6 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **USDT** | Base | 6 | Coming soon |
| **ETH** | Base | 18 | Native |

---

# 🎨 Frontend Integration

## Installation

```bash
npm install @agentic-eco/client
```

## Basic Setup

```typescript
import { AgenticClient } from '@agentic-eco/client';

const client = new AgenticClient({
  apiUrl: 'https://api.vega.com',
  defaultChain: 'base',
  defaultToken: 'USDC'
});
```

## React Integration

### Execute Workflow

```tsx
import { useState } from 'react';
import { AgenticClient } from '@agentic-eco/client';

function WorkflowExecutor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const client = new AgenticClient({ 
    apiUrl: 'https://api.vega.com' 
  });

  const executeWorkflow = async () => {
    setLoading(true);
    
    try {
      const result = await client.workflows.execute({
        yaml: workflowYaml,
        userId: 'user123',
        userWallet: '0x...',
        inputs: { message: 'Hello!' }
      });
      
      setResult(result);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={executeWorkflow} disabled={loading}>
        {loading ? 'Executing...' : 'Run Workflow'}
      </button>
      
      {result && (
        <div>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### Monitor Progress

```tsx
function WorkflowMonitor({ runId }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const pollProgress = async () => {
      const prog = await client.workflows.getProgress(runId);
      setProgress(prog);
      
      if (prog.status === 'running') {
        setTimeout(pollProgress, 1000);
      }
    };
    
    pollProgress();
  }, [runId]);

  return (
    <div>
      <h3>Workflow Progress</h3>
      <p>Status: {progress?.status}</p>
      <p>Current Node: {progress?.currentNode}</p>
      <p>Completed: {progress?.completedNodes.length}/{progress?.totalNodes}</p>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${(progress?.completedNodes.length / progress?.totalNodes) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}
```

### Agent Search

```tsx
function AgentBrowser() {
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    maxPrice: 1.0
  });

  const searchAgents = async () => {
    const results = await client.agents.search({
      category: filters.category || undefined,
      maxPrice: filters.maxPrice
    });
    setAgents(results);
  };

  return (
    <div>
      <input 
        placeholder="Category"
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
      />
      <input 
        type="number"
        placeholder="Max Price"
        value={filters.maxPrice}
        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
      />
      <button onClick={searchAgents}>Search</button>

      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card">
            <h4>{agent.name}</h4>
            <p>{agent.description}</p>
            <span className="price">${agent.pricing.perExecution}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Vue Integration

```vue
<template>
  <div>
    <button @click="executeWorkflow" :disabled="loading">
      {{ loading ? 'Executing...' : 'Run Workflow' }}
    </button>
    
    <div v-if="result">
      <h3>Result:</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { AgenticClient } from '@agentic-eco/client';

const client = new AgenticClient({ apiUrl: 'https://api.vega.com' });
const loading = ref(false);
const result = ref(null);

const executeWorkflow = async () => {
  loading.value = true;
  
  try {
    result.value = await client.workflows.execute({
      yaml: workflowYaml,
      userId: 'user123',
      inputs: { message: 'Hello!' }
    });
  } finally {
    loading.value = false;
  }
};
</script>
```

---

# 🖥️ CLI Reference

## Commands

### `agentic run`

Execute a workflow from YAML file

```bash
agentic run <file> [options]

Options:
  --inputs <json>     Input parameters as JSON
  --user <id>         User ID
  --wallet <address>  Wallet address
  --chain <name>      Blockchain (base, base-sepolia)
  --token <symbol>    Payment token (USDC, USDT)
  --watch            Watch mode (restart on changes)
  --verbose          Detailed output
  --json             JSON output format

Examples:
  agentic run workflow.yaml
  agentic run workflow.yaml --inputs '{"message":"Hello"}'
  agentic run workflow.yaml --watch --verbose
```

### `agentic agents`

Manage agents

```bash
# Search agents
agentic agents search [options]
  --category <cat>    Filter by category
  --max-price <n>     Maximum price
  --chain <name>      Blockchain
  --tags <tags>       Comma-separated tags
  --keyword <word>    Search keyword

# Register new agent
agentic agents register <file>
  --force            Overwrite if exists

# List registered agents
agentic agents list
  --json             JSON output

# Get agent details
agentic agents get <id>

# Publish agent
agentic agents publish <id>

# Unpublish agent
agentic agents unpublish <id>

# Update agent
agentic agents update <id> <file>

# Delete agent
agentic agents delete <id>
```

### `agentic validate`

Validate workflow YAML

```bash
agentic validate <file> [options]

Options:
  --verbose          Detailed validation output
  --json             JSON output format

Example:
  agentic validate workflow.yaml --verbose
```

### `agentic init`

Initialize new workflow

```bash
agentic init [name] [options]

Options:
  --template <type>  Template type (basic, advanced, pipeline)
  --output <file>    Output filename

Examples:
  agentic init my-workflow
  agentic init --template=pipeline
  agentic init my-workflow --template=advanced --output=custom.yaml
```

### `agentic status`

Check workflow execution status

```bash
agentic status <run-id> [options]

Options:
  --watch            Watch mode (real-time updates)
  --json             JSON output format

Example:
  agentic status wf_abc123 --watch
```

---

# 📖 API Reference

## AgenticClient

Main client for all operations

```typescript
class AgenticClient {
  constructor(config: ClientConfig);
  
  workflows: WorkflowClient;
  agents: AgentClient;
  payments: PaymentClient;
}

interface ClientConfig {
  apiUrl: string;
  defaultChain?: ChainType;
  defaultToken?: TokenSymbol;
  apiKey?: string;
}
```

## WorkflowClient

```typescript
class WorkflowClient {
  // Parse workflow YAML
  async parse(yaml: string): Promise<WorkflowDefinition>;
  
  // Validate workflow
  async validate(yaml: string): Promise<ValidationResult>;
  
  // Execute workflow
  async execute(request: WorkflowExecuteRequest): Promise<ExecutionResult>;
  
  // Get execution progress
  async getProgress(runId: string): Promise<ExecutionProgress>;
  
  // Get execution result
  async getResult(runId: string): Promise<WorkflowResult>;
  
  // Cancel execution
  async cancel(runId: string): Promise<void>;
  
  // Generate template
  async generateTemplate(type: string): Promise<string>;
}
```

## AgentClient

```typescript
class AgentClient {
  // Search agents
  async search(filters: AgentSearchFilters): Promise<AgentDefinition[]>;
  
  // Get agent by ID
  async getById(agentId: string): Promise<AgentDefinition>;
  
  // Create agent
  async create(agent: CreateAgentRequest): Promise<AgentDefinition>;
  
  // Update agent
  async update(agentId: string, updates: Partial<AgentDefinition>): Promise<void>;
  
  // Delete agent
  async delete(agentId: string): Promise<void>;
  
  // Publish agent
  async publish(agentId: string): Promise<void>;
  
  // Unpublish agent
  async unpublish(agentId: string): Promise<void>;
}
```

## PaymentClient

```typescript
class PaymentClient {
  // Get user budget
  async getUserBudget(userId: string): Promise<BudgetStatus>;
  
  // Add funds
  async addFunds(request: AddFundsRequest): Promise<void>;
  
  // Reserve budget
  async reserveBudget(request: ReserveBudgetRequest): Promise<string>;
  
  // Release reservation
  async releaseReservation(reservationId: string): Promise<void>;
  
  // Settle reservation
  async settleReservation(reservationId: string, actualSpent: string): Promise<void>;
  
  // Check sufficient funds
  async checkSufficientFunds(userId: string, amount: string): Promise<boolean>;
}
```

---

# 💻 Examples

## Example 1: Text Processing Pipeline

```yaml
name: text-processing-pipeline
version: 1.0.0
chain: base
maxBudget: 1.0
budgetToken: USDC

inputs:
  message:
    type: string
    required: true

nodes:
  - id: echo
    ref: echo-agent
    inputs:
      text: "{{inputs.message}}"
  
  - id: uppercase
    ref: text-transformer
    inputs:
      text: "{{echo.output.text}}"
      operation: uppercase
  
  - id: reverse
    ref: text-transformer
    inputs:
      text: "{{uppercase.output.transformed}}"
      operation: reverse

edges:
  - from: echo
    to: uppercase
  - from: uppercase
    to: reverse

outputs:
  original:
    value: "{{echo.output.text}}"
  uppercase:
    value: "{{uppercase.output.transformed}}"
  reversed:
    value: "{{reverse.output.transformed}}"
```

## Example 2: Executive Discussion

```yaml
name: executive-discussion
version: 1.0.0
description: CEO, CMO, and CTO discuss product idea
chain: base
maxBudget: 5.0
budgetToken: USDC

inputs:
  productIdea:
    type: string
    required: true
  rounds:
    type: number
    default: 1

nodes:
  - id: ceo
    ref: agent-ceo
    name: CEO Analysis
    inputs:
      productIdea: "{{inputs.productIdea}}"
      rounds: "{{inputs.rounds}}"
  
  - id: cmo
    ref: agent-cmo
    name: CMO Marketing Strategy
    depends: [ceo]
    inputs:
      productIdea: "{{inputs.productIdea}}"
      ceoAnalysis: "{{ceo.output.analysis}}"
  
  - id: cto
    ref: agent-cto
    name: CTO Technical Review
    depends: [ceo]
    inputs:
      productIdea: "{{inputs.productIdea}}"
      ceoAnalysis: "{{ceo.output.analysis}}"
  
  - id: summarize
    ref: summarizer-agent
    name: Summarize Discussion
    depends: [cmo, cto]
    inputs:
      ceoAnalysis: "{{ceo.output.analysis}}"
      cmoStrategy: "{{cmo.output.strategy}}"
      ctoReview: "{{cto.output.review}}"

edges:
  - from: ceo
    to: [cmo, cto]
  - from: [cmo, cto]
    to: summarize

outputs:
  summary:
    value: "{{summarize.output.summary}}"
  ceoAnalysis:
    value: "{{ceo.output.analysis}}"
  marketingStrategy:
    value: "{{cmo.output.strategy}}"
  technicalReview:
    value: "{{cto.output.review}}"
```

## Example 3: Data Analysis Pipeline

```yaml
name: data-analysis-pipeline
version: 1.0.0
chain: base
maxBudget: 10.0
budgetToken: USDC

inputs:
  dataUrl:
    type: string
    required: true
  analysisType:
    type: string
    default: comprehensive

nodes:
  - id: fetch
    ref: data-fetcher
    inputs:
      url: "{{inputs.dataUrl}}"
  
  - id: clean
    ref: data-cleaner
    depends: [fetch]
    inputs:
      data: "{{fetch.output.rawData}}"
  
  - id: analyze
    ref: data-analyzer
    depends: [clean]
    inputs:
      data: "{{clean.output.cleanData}}"
      analysisType: "{{inputs.analysisType}}"
  
  - id: visualize
    ref: data-visualizer
    depends: [analyze]
    inputs:
      analysis: "{{analyze.output.results}}"
  
  - id: report
    ref: report-generator
    depends: [analyze, visualize]
    inputs:
      analysis: "{{analyze.output.results}}"
      charts: "{{visualize.output.charts}}"

edges:
  - from: fetch
    to: clean
  - from: clean
    to: analyze
  - from: analyze
    to: [visualize, report]
  - from: visualize
    to: report

outputs:
  report:
    value: "{{report.output.document}}"
  charts:
    value: "{{visualize.output.charts}}"
  insights:
    value: "{{analyze.output.insights}}"
```

---

# ❓ FAQs

## General Questions

### What is Vega Protocol?

Vega Protocol is a platform for building, deploying, and monetizing multi-agent AI systems with built-in orchestration, payments, and agent discovery.

### Who is Vega Protocol for?

- **AI/ML Engineers** building specialized agents
- **Product Teams** needing agent-powered features
- **Frontend Developers** without backend expertise
- **Web3 Builders** leveraging on-chain payments
- **Indie Hackers** creating AI workflow products

### Is Vega Protocol free?

- **Platform**: Free to use (no platform fees initially)
- **Agents**: Pay-per-use pricing set by agent creators
- **CLI**: Free and open source
- **SDK**: Free and open source

### What blockchains are supported?

Currently:
- ✅ Base (mainnet)
- ✅ Base Sepolia (testnet)

Coming soon:
- 🔜 Arbitrum
- 🔜 Optimism
- 🔜 Polygon

### What tokens can I use for payments?

Currently:
- ✅ USDC
- 🔜 USDT (coming soon)
- 🔜 ETH (coming soon)

## Technical Questions

### How do workflows execute?

1. **Parse**: YAML converted to execution graph
2. **Validate**: Check for errors, cycles, budget
3. **Schedule**: Order nodes by dependencies
4. **Execute**: Run nodes in topological order
5. **Monitor**: Track progress in real-time
6. **Complete**: Return results and outputs

### Can workflows run in parallel?

Yes! Nodes without dependencies run in parallel automatically. Example:

```yaml
edges:
  - from: nodeA
    to: [nodeB, nodeC, nodeD]  # B, C, D run in parallel
```

### How are payments handled?

1. User reserves budget upfront (escrow)
2. Each agent gets paid on completion
3. Unused budget automatically refunded
4. On-chain USDC settlement

### What happens if a node fails?

- **Retry logic**: Automatic retries per retry policy
- **Graceful failure**: Workflow continues if not critical
- **Budget protection**: No payment for failed executions
- **Error reporting**: Detailed logs and error messages

### Can I build custom agents?

Yes! Agents are just HTTP APIs following the A2A protocol:

1. Implement A2A message endpoints
2. Create agent card at `/.well-known/agent-card.json`
3. Register in Vega Protocol
4. Set pricing and publish

See [Agent Development Guide](AGENTS_AND_WORKFLOWS.md) for details.

### Is my data secure?

- **End-to-end encryption**: Coming soon
- **On-chain payments**: Transparent and verifiable
- **No data storage**: Workflows are stateless
- **Agent reputation**: Trust scores and verification

### How do I debug workflows?

```bash
# Validate before running
agentic validate workflow.yaml --verbose

# Run with detailed logs
agentic run workflow.yaml --verbose

# Monitor in real-time
agentic status <run-id> --watch
```

---

# 🗺️ Roadmap

## ✅ Completed (Q4 2024)

- ✅ Core workflow engine
- ✅ Agent registry
- ✅ YAML parser and validator
- ✅ CLI tool
- ✅ Frontend SDK
- ✅ A2A protocol integration
- ✅ x402 payment middleware
- ✅ Base/Base Sepolia support

## 🚧 In Progress (Q1 2025)

- 🚧 **ERC-8004 Agent Identity**
  - On-chain agent registration
  - Verifiable credentials
  - Reputation scoring

- 🚧 **Multi-chain Expansion**
  - Arbitrum support
  - Optimism support
  - Cross-chain settlements

- 🚧 **Agent Marketplace UI**
  - Web-based agent browser
  - Workflow designer (visual)
  - Dashboard and analytics

## 🔜 Coming Soon (Q2 2025)

- 🔜 **Streaming Support**
  - Real-time agent outputs
  - Progress streaming
  - WebSocket support

- 🔜 **Advanced Features**
  - Conditional execution
  - Loops and iterations
  - Error recovery strategies
  - Workflow versioning

- 🔜 **Developer Tools**
  - Workflow testing framework
  - Agent SDK (Python, TypeScript)
  - Local development environment
  - CI/CD integrations

## 🎯 Future (2025+)

- Agent-to-agent direct communication
- Decentralized agent registry (IPFS)
- Privacy-preserving execution (ZK proofs)
- AI model fine-tuning marketplace
- Enterprise features (SSO, RBAC)
- Mobile SDK (iOS, Android)

---

# 🤝 Community & Support

## Resources

- **Documentation**: [docs.vega.com](https://docs.vega.com)
- **GitHub**: [github.com/useVega/vega-protocol](https://github.com/useVega/vega-protocol)
- **Discord**: [discord.gg/vega](https://discord.gg/vega)
- **Twitter**: [@VegaProtocol](https://twitter.com/VegaProtocol)
- **Blog**: [blog.vega.com](https://blog.vega.com)

## Get Help

- **Discord**: Join #support channel
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@vega.com
- **Documentation**: Comprehensive guides and examples

## Contribute

We welcome contributions!

- **Code**: Submit PRs on GitHub
- **Agents**: Publish agents to marketplace
- **Documentation**: Improve docs and examples
- **Community**: Help others on Discord

## Stay Updated

- 📧 **Newsletter**: [vega.com/newsletter](https://vega.com/newsletter)
- 🐦 **Twitter**: [@VegaProtocol](https://twitter.com/VegaProtocol)
- 📝 **Blog**: [blog.vega.com](https://blog.vega.com)
- 💬 **Discord**: [discord.gg/vega](https://discord.gg/vega)

---

# 📄 License

Vega Protocol is open source software licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Vega Protocol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ❤️ by the Vega Protocol team**

[Website](https://vega.com) • [Documentation](https://docs.vega.com) • [GitHub](https://github.com/useVega) • [Discord](https://discord.gg/vega)

</div>
