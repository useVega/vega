# Frontend Abstraction - Quick Reference

## Installation & Setup

```typescript
import { AgenticClient } from './src/frontend';

const client = new AgenticClient({
  apiUrl: 'http://localhost:3000',
  defaultChain: 'base',
  defaultToken: 'USDC',
});
```

## Common Operations

### 1. Parse Workflow

```typescript
const result = await client.workflows.parse(yamlString, userId);
// Returns: { valid: boolean, workflow?: {...}, errors?: [...] }
```

### 2. Execute Workflow

```typescript
const result = await client.workflows.execute({
  yaml: workflowYaml,
  userId: 'user123',
  userWallet: '0x...',
  inputs: { text: 'Hello' },
});
// Returns: { success: boolean, runId?: string, error?: string }
```

### 3. Monitor Progress

```typescript
const progress = await client.workflows.getProgress(runId);
// Returns: ExecutionProgress | null
```

### 4. Get Result

```typescript
const result = await client.workflows.getResult(runId);
// Returns: WorkflowResult | null
```

### 5. Search Agents

```typescript
const result = await client.agents.search({
  category: 'ai-ml',
  status: 'active',
  maxPrice: '0.10',
});
// Returns: { agents: AgentInfo[], total: number }
```

### 6. Create Agent

```typescript
const result = await client.agents.create({
  ref: 'my-agent-v1',
  name: 'My Agent',
  description: 'Does something',
  category: 'data-processing',
  // ... other fields
});
// Returns: { success: boolean, agent?: AgentInfo, error?: string }
```

### 7. Check Budget

```typescript
const status = await client.payments.getStatus(userId, 'USDC', 'base');
// Returns: PaymentStatus | null
```

### 8. Add Funds

```typescript
const result = await client.payments.addFunds(userId, '10.0', 'USDC');
// Returns: { success: boolean, newBalance?: string, error?: string }
```

## Response Patterns

### Success Response
```typescript
{
  success: true,
  data: {...}
}
```

### Error Response
```typescript
{
  success: false,
  error: "Error message"
}
```

## Type Imports

```typescript
import type {
  ClientConfig,
  WorkflowExecuteRequest,
  WorkflowResult,
  ExecutionProgress,
  AgentSearchFilters,
  AgentInfo,
  PaymentStatus,
  BudgetInfo,
} from './src/frontend';
```

## React Hook Example

```typescript
function useWorkflowExecution() {
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);

  const execute = async (yaml: string, inputs: any) => {
    const result = await client.workflows.execute({
      yaml,
      userId: 'current-user',
      userWallet: '0x...',
      inputs,
    });
    if (result.success) setRunId(result.runId!);
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

  return { execute, progress };
}
```

## Error Handling

```typescript
try {
  const result = await client.workflows.execute(request);
  
  if (!result.success) {
    // Business logic error
    console.error(result.error);
    return;
  }
  
  // Success
  console.log('Started:', result.runId);
  
} catch (error) {
  // Unexpected error
  console.error('Unexpected:', error);
}
```

## Configuration Update

```typescript
client.updateConfig({
  defaultChain: 'arbitrum',
  defaultToken: 'USDT',
});
```

## Health Check

```typescript
const health = await client.healthCheck();
console.log('Status:', health.status);
console.log('Services:', health.services);
```

## Key Methods Reference

### WorkflowClient
- `parse(yaml, userId)` - Parse and validate YAML
- `create(request)` - Create workflow
- `execute(request)` - Execute workflow
- `getProgress(runId)` - Get execution progress
- `getResult(runId)` - Get final result
- `cancel(runId)` - Cancel execution
- `generateTemplate()` - Generate YAML template

### AgentClient
- `create(request)` - Create agent
- `publish(agentRef)` - Publish agent
- `unpublish(agentRef)` - Unpublish agent
- `search(filters)` - Search agents
- `get(agentRef)` - Get agent details
- `delete(agentRef)` - Delete agent
- `getCategories()` - List categories

### PaymentClient
- `getStatus(userId, token, chain)` - Get payment status
- `getBudgetInfo(userId, wallet, token, chain)` - Get budget details
- `addFunds(userId, amount, token)` - Add funds
- `reserveBudget(userId, runId, amount, token)` - Reserve budget
- `releaseBudget(userId, runId, token)` - Release budget
- `settleBudget(userId, runId, actualAmount, token)` - Settle budget
- `checkSufficientFunds(userId, amount, token)` - Check funds
- `getSupportedTokens()` - List tokens
- `getSupportedChains()` - List chains

## Best Practices

1. **Always check success flag** before accessing data
2. **Use TypeScript** for type safety
3. **Poll for progress** with cleanup in useEffect
4. **Check budget** before workflow execution
5. **Handle both business and unexpected errors**
6. **Store config in environment variables**
7. **Use React Context** for client instance
8. **Implement proper loading states**
9. **Show user-friendly error messages**
10. **Clean up intervals and subscriptions**

## File Structure

```
src/frontend/
├── index.ts                 # Main exports
├── types.ts                 # Type definitions
├── agentic-client.ts        # Main client
├── workflow-client.ts       # Workflow operations
├── agent-client.ts          # Agent operations
└── payment-client.ts        # Payment operations
```

## Next Steps

1. Run demo: `bun run frontend-demo.ts`
2. Read docs: `FRONTEND_ABSTRACTION.md`
3. See examples: `examples/react-components.tsx`
4. Check types: `src/frontend/types.ts`
