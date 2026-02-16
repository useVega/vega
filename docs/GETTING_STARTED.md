# Getting Started with Frontend Abstraction

## 5-Minute Quick Start

### Step 1: Import the Client

```typescript
import { AgenticClient } from './src/frontend';
```

### Step 2: Initialize

```typescript
const client = new AgenticClient({
  apiUrl: 'http://localhost:3000',
  defaultChain: 'base',
  defaultToken: 'USDC',
});
```

### Step 3: Use It!

```typescript
// Execute a workflow
const result = await client.workflows.execute({
  yaml: myWorkflowYaml,
  userId: 'user123',
  userWallet: '0x...',
  inputs: { message: 'Hello!' },
});

console.log('Run ID:', result.runId);
```

That's it! 🎉

---

## Common Patterns

### Pattern 1: Execute and Monitor

```typescript
// Start execution
const { success, runId } = await client.workflows.execute({
  yaml: workflowYaml,
  userId: 'user123',
  userWallet: '0x...',
  inputs: { text: 'Hello' },
});

if (!success) {
  console.error('Failed to start');
  return;
}

// Monitor progress
const checkProgress = setInterval(async () => {
  const progress = await client.workflows.getProgress(runId!);
  
  if (progress?.status === 'completed') {
    clearInterval(checkProgress);
    const result = await client.workflows.getResult(runId!);
    console.log('Done!', result?.outputs);
  }
}, 1000);
```

### Pattern 2: Search and Use Agents

```typescript
// Find agents
const { agents } = await client.agents.search({
  category: 'ai-ml',
  maxPrice: '0.10',
  status: 'active',
});

// Pick one
const agent = agents[0];

// Use in workflow
const workflow = `
name: My Workflow
...
nodes:
  analyze:
    type: agent
    agent: ${agent.ref}
    ...
`;
```

### Pattern 3: Budget Management

```typescript
// Check funds
const status = await client.payments.getStatus(userId, 'USDC');

if (parseFloat(status.availableBudget) < 1.0) {
  // Add funds
  await client.payments.addFunds(userId, '10.0', 'USDC');
}

// Now execute workflow
await client.workflows.execute({ ... });
```

---

## React Hook

```typescript
function useWorkflow() {
  const [state, setState] = useState({
    executing: false,
    progress: null,
    result: null,
    error: null,
  });

  const execute = async (yaml: string, inputs: any) => {
    setState({ executing: true, progress: null, result: null, error: null });
    
    const result = await client.workflows.execute({
      yaml,
      userId: 'current-user',
      userWallet: '0x...',
      inputs,
    });

    if (!result.success) {
      setState({ ...state, executing: false, error: result.error });
      return;
    }

    // Monitor progress
    const runId = result.runId!;
    const interval = setInterval(async () => {
      const progress = await client.workflows.getProgress(runId);
      setState(prev => ({ ...prev, progress }));

      if (progress?.status === 'completed' || progress?.status === 'failed') {
        clearInterval(interval);
        const finalResult = await client.workflows.getResult(runId);
        setState(prev => ({
          ...prev,
          executing: false,
          result: finalResult,
        }));
      }
    }, 1000);
  };

  return { ...state, execute };
}

// Usage
function MyComponent() {
  const { executing, progress, result, execute } = useWorkflow();
  
  return (
    <div>
      <button onClick={() => execute(yaml, inputs)} disabled={executing}>
        Execute
      </button>
      {progress && <Progress value={progress} />}
      {result && <Result data={result} />}
    </div>
  );
}
```

---

## Environment Setup

```bash
# .env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_CHAIN=base
NEXT_PUBLIC_DEFAULT_TOKEN=USDC
```

```typescript
// lib/agentic-client.ts
import { AgenticClient } from './src/frontend';

export const client = new AgenticClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  defaultChain: process.env.NEXT_PUBLIC_DEFAULT_CHAIN as any,
  defaultToken: process.env.NEXT_PUBLIC_DEFAULT_TOKEN as any,
});
```

---

## Error Handling

```typescript
// Pattern: Try-Catch with Result Check
try {
  const result = await client.workflows.execute(request);
  
  if (!result.success) {
    // Business logic error (validation, etc.)
    toast.error(result.error);
    return;
  }
  
  // Success!
  toast.success('Workflow started');
  
} catch (error) {
  // Unexpected error (network, etc.)
  console.error('Unexpected error:', error);
  toast.error('Something went wrong');
}
```

---

## TypeScript Tips

```typescript
// Import types
import type {
  WorkflowResult,
  ExecutionProgress,
  AgentInfo,
} from './src/frontend';

// Use in state
const [progress, setProgress] = useState<ExecutionProgress | null>(null);
const [agents, setAgents] = useState<AgentInfo[]>([]);

// Type-safe execution
const execute = async (request: WorkflowExecuteRequest) => {
  const result = await client.workflows.execute(request);
  return result;
};
```

---

## Common Mistakes

### ❌ Don't: Forget to check success

```typescript
const result = await client.workflows.execute(request);
console.log(result.runId); // Error if success is false!
```

### ✅ Do: Always check success

```typescript
const result = await client.workflows.execute(request);
if (result.success) {
  console.log(result.runId);
}
```

### ❌ Don't: Forget to cleanup intervals

```typescript
setInterval(async () => {
  const progress = await client.workflows.getProgress(runId);
  // Never stops!
}, 1000);
```

### ✅ Do: Cleanup properly

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const progress = await client.workflows.getProgress(runId);
    if (progress?.status === 'completed') {
      clearInterval(interval);
    }
  }, 1000);
  
  return () => clearInterval(interval); // Cleanup!
}, [runId]);
```

---

## Testing

```typescript
import { describe, it, expect, mock } from 'bun:test';
import { AgenticClient } from './src/frontend';

describe('Workflow Execution', () => {
  it('should execute workflow', async () => {
    const client = new AgenticClient();
    
    const result = await client.workflows.execute({
      yaml: validYaml,
      userId: 'test',
      userWallet: '0x...',
      inputs: {},
    });
    
    expect(result.success).toBe(true);
    expect(result.runId).toBeDefined();
  });
});
```

---

## Troubleshooting

### Problem: "Agent not found"
**Solution**: Make sure agent is published

```typescript
await client.agents.publish('my-agent-v1');
```

### Problem: "Insufficient budget"
**Solution**: Add funds first

```typescript
await client.payments.addFunds('user123', '10.0', 'USDC');
```

### Problem: Progress not updating
**Solution**: Check interval is set correctly

```typescript
// Good: 1 second interval
setInterval(checkProgress, 1000);

// Bad: Too frequent
setInterval(checkProgress, 100); // Don't do this
```

---

## More Resources

- 📚 **Full Docs**: `FRONTEND_ABSTRACTION.md`
- 📖 **Quick Ref**: `FRONTEND_QUICK_REF.md`
- 🎨 **Examples**: `examples/react-components.tsx`
- 🚀 **Demo**: `bun run frontend-demo.ts`

---

## Support

Need help? Check:
1. Type definitions in `src/frontend/types.ts`
2. Working examples in `frontend-demo.ts`
3. React components in `examples/react-components.tsx`

Happy coding! 🎉
