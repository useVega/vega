# Frontend Abstraction Module

## Overview

The Frontend Abstraction Module provides a simplified, type-safe API layer for integrating the Agentic Ecosystem into frontend applications. It wraps the complex backend services into easy-to-use client interfaces.

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend Application            │
│   (React, Vue, Angular, etc.)           │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│       AgenticClient (Main Entry)        │
├─────────────────────────────────────────┤
│  • workflows: WorkflowClient            │
│  • agents: AgentClient                  │
│  • payments: PaymentClient              │
└───────────┬─────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────┐
│         Backend Services                  │
├───────────────────────────────────────────┤
│  • WorkflowYAMLParser                     │
│  • WorkflowValidator                      │
│  • WorkflowExecutionEngine                │
│  • AgentRegistry                          │
│  • BudgetManager                          │
│  • A2AAgentCaller                         │
└───────────────────────────────────────────┘
```

## Installation

```typescript
import { AgenticClient } from './src/frontend';

// Initialize the client
const client = new AgenticClient({
  apiUrl: 'http://localhost:3000',
  defaultChain: 'base',
  defaultToken: 'USDC',
  timeout: 30000,
});
```

## Core Components

### 1. AgenticClient (Main Interface)

The main entry point that provides access to all sub-clients.

```typescript
const client = new AgenticClient({
  apiUrl: 'http://localhost:3000',
  defaultChain: 'base',
  defaultToken: 'USDC',
});

// Access sub-clients
client.workflows  // Workflow operations
client.agents     // Agent management
client.payments   // Budget and payments
```

### 2. WorkflowClient

Handles workflow parsing, validation, and execution.

#### Parse a Workflow

```typescript
const parseResult = await client.workflows.parse(yamlString, userId);

if (parseResult.valid) {
  console.log('Valid workflow:', parseResult.workflow);
} else {
  console.error('Errors:', parseResult.errors);
}
```

#### Execute a Workflow

```typescript
const executeResult = await client.workflows.execute({
  yaml: workflowYaml,
  userId: 'user123',
  userWallet: '0x...',
  inputs: {
    text: 'Hello world',
  },
  maxBudget: '1.0',
  chain: 'base',
  token: 'USDC',
});

if (executeResult.success) {
  console.log('Execution started:', executeResult.runId);
}
```

#### Monitor Progress

```typescript
const progress = await client.workflows.getProgress(runId);

console.log('Status:', progress.status);
console.log('Progress:', progress.completedNodes.length, '/', progress.totalNodes);
console.log('Current node:', progress.currentNode);
```

#### Get Results

```typescript
const result = await client.workflows.getResult(runId);

if (result && result.status === 'completed') {
  console.log('Outputs:', result.outputs);
  console.log('Total cost:', result.totalCost);
  console.log('Duration:', result.executionTime);
}
```

### 3. AgentClient

Manages agent registration and discovery.

#### Create an Agent

```typescript
const createResult = await client.agents.create({
  ref: 'my-agent-v1',
  name: 'My Agent',
  description: 'Does something cool',
  category: 'data-processing',
  version: '1.0.0',
  ownerWallet: '0x...',
  endpointType: 'http',
  endpointUrl: 'https://api.example.com/agent',
  pricing: {
    type: 'per-call',
    amount: '0.05',
    token: 'USDC',
    chain: 'base',
  },
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* JSON Schema */ },
  tags: ['nlp', 'text'],
});
```

#### Search for Agents

```typescript
const searchResult = await client.agents.search({
  category: 'ai-ml',
  chain: 'base',
  token: 'USDC',
  maxPrice: '0.10',
  status: 'active',
  search: 'sentiment',
});

console.log('Found:', searchResult.total, 'agents');
searchResult.agents.forEach(agent => {
  console.log('-', agent.name, ':', agent.pricing.amount, agent.pricing.token);
});
```

#### Get Agent Details

```typescript
const agent = await client.agents.get('agent-ref-v1');

if (agent) {
  console.log('Agent:', agent.name);
  console.log('Description:', agent.description);
  console.log('Price:', agent.pricing.amount, agent.pricing.token);
  console.log('Status:', agent.status);
}
```

### 4. PaymentClient

Handles budget management and payments.

#### Add Funds

```typescript
const addResult = await client.payments.addFunds(
  'user123',
  '10.0',
  'USDC'
);

if (addResult.success) {
  console.log('New balance:', addResult.newBalance);
}
```

#### Check Balance

```typescript
const status = await client.payments.getStatus('user123', 'USDC', 'base');

if (status) {
  console.log('Available:', status.availableBudget);
  console.log('Reserved:', status.reservedBudget);
  console.log('Spent:', status.totalSpent);
}
```

#### Get Budget Info

```typescript
const budgetInfo = await client.payments.getBudgetInfo(
  'user123',
  '0x...',
  'USDC',
  'base'
);

if (budgetInfo) {
  console.log('Reservations:', budgetInfo.reservations.length);
  budgetInfo.reservations.forEach(res => {
    console.log('-', res.runId, ':', res.amount);
  });
}
```

## Type Definitions

### Workflow Types

```typescript
interface WorkflowExecuteRequest {
  workflowId?: string;
  yaml?: string;
  userId: string;
  userWallet: string;
  inputs: Record<string, any>;
  maxBudget?: string;
  chain?: ChainType;
  token?: TokenSymbol;
}

interface WorkflowResult {
  runId: string;
  status: WorkflowExecutionStatus;
  outputs: Record<string, any>;
  executionTime: number;
  totalCost: string;
  nodeResults: Array<NodeResult>;
}

type WorkflowExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

### Agent Types

```typescript
interface AgentSearchFilters {
  category?: string;
  chain?: ChainType;
  token?: TokenSymbol;
  tag?: string;
  status?: 'active' | 'inactive';
  minPrice?: string;
  maxPrice?: string;
  search?: string;
}

interface AgentInfo {
  ref: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'inactive';
  pricing: {
    type: string;
    amount: string;
    token: TokenSymbol;
    chain: ChainType;
  };
  tags: string[];
  stats?: {
    totalCalls?: number;
    successRate?: number;
    avgResponseTime?: number;
  };
}
```

### Payment Types

```typescript
interface PaymentStatus {
  userId: string;
  availableBudget: string;
  reservedBudget: string;
  totalSpent: string;
  token: TokenSymbol;
  chain: ChainType;
}

interface BudgetInfo extends PaymentStatus {
  userWallet: string;
  reservations: Array<{
    runId: string;
    amount: string;
    createdAt: Date;
  }>;
}
```

## React Integration Example

```typescript
import { useState, useEffect } from 'react';
import { AgenticClient } from '@/lib/agentic';

// Custom hook
function useAgenticClient() {
  const [client] = useState(() => new AgenticClient({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    defaultChain: 'base',
    defaultToken: 'USDC',
  }));

  return client;
}

// Component
function WorkflowExecutor() {
  const client = useAgenticClient();
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);

  const executeWorkflow = async (yaml: string, inputs: any) => {
    const result = await client.workflows.execute({
      yaml,
      userId: 'current-user',
      userWallet: '0x...',
      inputs,
    });

    if (result.success) {
      setRunId(result.runId!);
    }
  };

  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      const prog = await client.workflows.getProgress(runId);
      setProgress(prog);

      if (prog?.status === 'completed' || prog?.status === 'failed') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [runId]);

  return (
    <div>
      {progress && (
        <div>
          <p>Status: {progress.status}</p>
          <p>Progress: {progress.completedNodes.length} / {progress.totalNodes}</p>
        </div>
      )}
    </div>
  );
}
```

## Vue Integration Example

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AgenticClient } from '@/lib/agentic';

const client = new AgenticClient({
  apiUrl: import.meta.env.VITE_API_URL,
  defaultChain: 'base',
  defaultToken: 'USDC',
});

const agents = ref([]);
const loading = ref(false);

const searchAgents = async (filters) => {
  loading.value = true;
  const result = await client.agents.search(filters);
  agents.value = result.agents;
  loading.value = false;
};

onMounted(() => {
  searchAgents({ status: 'active' });
});
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="agent in agents" :key="agent.ref">
        <h3>{{ agent.name }}</h3>
        <p>{{ agent.description }}</p>
        <p>Price: {{ agent.pricing.amount }} {{ agent.pricing.token }}</p>
      </div>
    </div>
  </div>
</template>
```

## Error Handling

All client methods return structured responses with error information:

```typescript
const result = await client.workflows.execute(request);

if (!result.success) {
  // Handle error
  console.error('Error:', result.error);
  // Show user-friendly message
  toast.error(`Failed to execute workflow: ${result.error}`);
}
```

## Best Practices

### 1. Configuration Management

```typescript
// Store configuration in environment variables
const client = new AgenticClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  defaultChain: process.env.NEXT_PUBLIC_DEFAULT_CHAIN as ChainType,
  defaultToken: process.env.NEXT_PUBLIC_DEFAULT_TOKEN as TokenSymbol,
});
```

### 2. Error Boundaries

```typescript
try {
  const result = await client.workflows.execute(request);
  if (!result.success) {
    // Handle business logic errors
    showError(result.error);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
  showError('An unexpected error occurred');
}
```

### 3. Progress Monitoring

```typescript
// Use polling with cleanup
useEffect(() => {
  if (!runId) return;

  const interval = setInterval(async () => {
    const progress = await client.workflows.getProgress(runId);
    updateProgress(progress);

    if (progress?.status === 'completed' || progress?.status === 'failed') {
      clearInterval(interval);
      handleCompletion(progress);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [runId]);
```

### 4. Budget Checks

```typescript
// Check budget before execution
const hasFunds = await client.payments.checkSufficientFunds(
  userId,
  workflow.maxBudget,
  'USDC'
);

if (!hasFunds) {
  showError('Insufficient funds. Please add more budget.');
  return;
}

// Proceed with execution
await client.workflows.execute(request);
```

## Testing

```typescript
import { describe, it, expect } from 'bun:test';
import { AgenticClient } from './src/frontend';

describe('AgenticClient', () => {
  it('should initialize with config', () => {
    const client = new AgenticClient({
      apiUrl: 'http://test',
      defaultChain: 'base',
    });

    expect(client.getConfig().apiUrl).toBe('http://test');
    expect(client.getConfig().defaultChain).toBe('base');
  });

  it('should parse valid workflow', async () => {
    const client = new AgenticClient();
    const yaml = `...`; // Valid YAML
    
    const result = await client.workflows.parse(yaml, 'user123');
    expect(result.valid).toBe(true);
  });
});
```

## API Reference

See [types.ts](./src/frontend/types.ts) for complete type definitions.

### Main Exports

- `AgenticClient` - Main client class
- `WorkflowClient` - Workflow operations
- `AgentClient` - Agent management
- `PaymentClient` - Payment operations

### Type Exports

- `ClientConfig` - Client configuration
- `WorkflowExecuteRequest` - Workflow execution request
- `WorkflowResult` - Execution result
- `AgentSearchFilters` - Agent search filters
- `AgentInfo` - Agent information
- `PaymentStatus` - Payment status
- `BudgetInfo` - Budget information

## Demo

Run the demo to see all features in action:

```bash
bun run frontend-demo.ts
```

## Next Steps

1. **REST API Layer**: Wrap these clients in HTTP endpoints
2. **WebSocket Support**: Real-time progress updates
3. **Caching**: Add request caching for better performance
4. **Pagination**: Add pagination support for large result sets
5. **Batch Operations**: Support batch agent operations
6. **Analytics**: Add usage analytics and metrics

## Support

For issues or questions, please refer to the main project documentation.
