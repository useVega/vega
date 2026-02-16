# @agentic-eco/client

[![npm version](https://img.shields.io/npm/v/@agentic-eco/client.svg)](https://www.npmjs.com/package/@agentic-eco/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Frontend client library for the Agentic Ecosystem. Build, execute, and monitor multi-agent workflows with YAML-based definitions.

## Features

✨ **YAML Workflow Parser** - Parse and validate workflow definitions  
🔍 **Type-Safe API** - Full TypeScript support with comprehensive types  
🚀 **Framework Agnostic** - Works with React, Vue, Angular, Svelte  
📦 **Zero Backend Dependencies** - Standalone parsing and validation  
🎯 **Simple API** - Intuitive interface for workflow management  
⚡ **Lightweight** - Minimal dependencies, tree-shakeable

## Installation

```bash
npm install @agentic-eco/client
# or
yarn add @agentic-eco/client
# or
pnpm add @agentic-eco/client
# or
bun add @agentic-eco/client
```

## Quick Start

### Parse a Workflow YAML

```typescript
import { WorkflowYAMLParser } from '@agentic-eco/client';

const parser = new WorkflowYAMLParser();

const yamlContent = `
name: "My Workflow"
version: "1.0.0"
description: "A simple workflow"
chain: "base"
token: "USDC"
maxBudget: "5.0"

nodes:
  - id: step1
    ref: text-processor-v1
    name: "Process Text"
    inputs:
      text: "{{inputs.text}}"

edges:
  - from: step1
    to: output
`;

const result = parser.parse(yamlContent);

if (result.valid) {
  console.log('Workflow:', result.workflow);
} else {
  console.error('Errors:', result.errors);
}
```

### Generate Workflow YAML

```typescript
import { WorkflowYAMLParser } from '@agentic-eco/client';
import type { WorkflowDefinition } from '@agentic-eco/client';

const parser = new WorkflowYAMLParser();

const workflow: WorkflowDefinition = {
  name: "Data Pipeline",
  version: "1.0.0",
  description: "Process and analyze data",
  chain: "base",
  token: "USDC",
  maxBudget: "10.0",
  inputs: {
    data: {
      type: "string",
      description: "Input data",
      required: true,
    },
  },
  outputs: {
    result: {
      type: "string",
      description: "Processed result",
      value: "{{process.output}}",
    },
  },
  nodes: [
    {
      id: "process",
      ref: "data-processor-v1",
      name: "Process Data",
      description: "Process the input data",
      inputs: {
        data: "{{inputs.data}}",
      },
    },
  ],
  edges: [],
  metadata: {
    tags: ["data", "processing"],
  },
};

const yaml = parser.stringify(workflow);
console.log(yaml);
```

### Generate Template

```typescript
import { WorkflowYAMLParser } from '@agentic-eco/client';

const parser = new WorkflowYAMLParser();
const template = parser.generateTemplate();

console.log(template);
// Outputs a ready-to-use workflow template
```

## API Reference

### WorkflowYAMLParser

The main parser class for working with workflow YAML files.

#### `parse(yamlContent: string): ParseResult`

Parse a YAML string into a WorkflowDefinition.

**Parameters:**
- `yamlContent` - YAML string to parse

**Returns:**
```typescript
{
  valid: boolean;
  workflow?: WorkflowDefinition;
  errors?: ValidationError[];
}
```

#### `stringify(workflow: WorkflowDefinition): string`

Convert a WorkflowDefinition to YAML string.

**Parameters:**
- `workflow` - WorkflowDefinition object

**Returns:** YAML string

#### `generateTemplate(): string`

Generate a template workflow YAML.

**Returns:** Template YAML string

## Types

### WorkflowDefinition

```typescript
interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;
  chain: ChainType;
  token: TokenSymbol;
  maxBudget: string;
  inputs: Record<string, WorkflowInput>;
  outputs: Record<string, WorkflowOutput>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: WorkflowMetadata;
}
```

### WorkflowNode

```typescript
interface WorkflowNode {
  id: string;
  ref: string; // Agent reference
  name: string;
  description: string;
  inputs: Record<string, any>;
  retry?: RetryConfig;
}
```

### ParseResult

```typescript
interface ParseResult {
  valid: boolean;
  workflow?: WorkflowDefinition;
  errors?: ValidationError[];
}
```

### ValidationError

```typescript
interface ValidationError {
  type: 'syntax' | 'validation' | 'semantic';
  message: string;
  line?: number;
  path?: string;
}
```

## Framework Examples

### React

```tsx
import { useState } from 'react';
import { WorkflowYAMLParser } from '@agentic-eco/client';
import type { ParseResult } from '@agentic-eco/client';

function WorkflowEditor() {
  const [yaml, setYaml] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const parser = new WorkflowYAMLParser();

  const handleParse = () => {
    const parseResult = parser.parse(yaml);
    setResult(parseResult);
  };

  return (
    <div>
      <textarea
        value={yaml}
        onChange={(e) => setYaml(e.target.value)}
        placeholder="Enter workflow YAML..."
      />
      <button onClick={handleParse}>Parse</button>
      
      {result && (
        <div>
          {result.valid ? (
            <pre>{JSON.stringify(result.workflow, null, 2)}</pre>
          ) : (
            <ul>
              {result.errors?.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { WorkflowYAMLParser } from '@agentic-eco/client';
import type { ParseResult } from '@agentic-eco/client';

const yaml = ref('');
const result = ref<ParseResult | null>(null);
const parser = new WorkflowYAMLParser();

const handleParse = () => {
  result.value = parser.parse(yaml.value);
};
</script>

<template>
  <div>
    <textarea
      v-model="yaml"
      placeholder="Enter workflow YAML..."
    />
    <button @click="handleParse">Parse</button>
    
    <div v-if="result">
      <pre v-if="result.valid">{{ result.workflow }}</pre>
      <ul v-else>
        <li v-for="(err, i) in result.errors" :key="i">
          {{ err.message }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

### Angular

```typescript
import { Component } from '@angular/core';
import { WorkflowYAMLParser } from '@agentic-eco/client';
import type { ParseResult } from '@agentic-eco/client';

@Component({
  selector: 'app-workflow-editor',
  template: `
    <textarea [(ngModel)]="yaml"></textarea>
    <button (click)="parse()">Parse</button>
    
    <div *ngIf="result">
      <pre *ngIf="result.valid">{{ result.workflow | json }}</pre>
      <ul *ngIf="!result.valid">
        <li *ngFor="let err of result.errors">{{ err.message }}</li>
      </ul>
    </div>
  `
})
export class WorkflowEditorComponent {
  yaml = '';
  result: ParseResult | null = null;
  parser = new WorkflowYAMLParser();

  parse() {
    this.result = this.parser.parse(this.yaml);
  }
}
```

## Workflow YAML Structure

A complete workflow YAML file includes:

```yaml
# Metadata
name: "Workflow Name"
version: "1.0.0"
description: "Workflow description"

# Execution Configuration
chain: "base"           # base | arbitrum | ethereum | solana
token: "USDC"           # USDC | USDT | ETH | SOL
maxBudget: "5.0"

# Optional Tags
tags:
  - tag1
  - tag2

# Input Parameters
inputs:
  paramName:
    type: string
    description: "Parameter description"
    required: true
    default: "default value"

# Output Definitions
outputs:
  resultName:
    type: string
    description: "Output description"
    value: "{{node.output}}"

# Workflow Nodes (Steps)
nodes:
  - id: step1
    ref: agent-reference-v1
    name: "Step Name"
    description: "Step description"
    inputs:
      param: "{{inputs.paramName}}"
    retry:
      maxAttempts: 3
      backoffMs: 1000

# Node Connections
edges:
  - from: step1
    to: step2
    condition: "{{step1.success}}"
```

## Validation

The parser performs comprehensive validation:

- ✅ Required fields (name, version, nodes)
- ✅ Node ID uniqueness
- ✅ Edge reference validity
- ✅ Budget value format
- ✅ YAML syntax correctness
- ✅ Type checking

## Error Handling

Parse errors are categorized:

- **syntax** - YAML parsing errors
- **validation** - Missing required fields, invalid references
- **semantic** - Logic errors, circular dependencies

```typescript
const result = parser.parse(yaml);

if (!result.valid) {
  result.errors?.forEach(error => {
    console.error(`[${error.type}] ${error.message}`);
    if (error.path) {
      console.error(`  at ${error.path}`);
    }
  });
}
```

## TypeScript Support

Full TypeScript definitions included. Import types as needed:

```typescript
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  ParseResult,
  ValidationError,
  ChainType,
  TokenSymbol,
} from '@agentic-eco/client';
```

## Best Practices

### 1. Validate Before Use

Always check the `valid` field before using parsed workflows:

```typescript
const result = parser.parse(yaml);
if (result.valid && result.workflow) {
  // Use result.workflow
}
```

### 2. Handle Errors Gracefully

Display user-friendly error messages:

```typescript
if (!result.valid) {
  const messages = result.errors?.map(e => e.message).join('\n');
  alert(`Workflow validation failed:\n${messages}`);
}
```

### 3. Cache Parser Instance

Reuse the parser instance across multiple parses:

```typescript
const parser = new WorkflowYAMLParser();

// Use for multiple files
const result1 = parser.parse(yaml1);
const result2 = parser.parse(yaml2);
```

## Examples

See the `/examples` directory for complete examples:

- React workflow editor
- Vue workflow builder
- Angular workflow validator
- Node.js CLI tool

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT © Agentic Ecosystem

## Links

- [Documentation](https://docs.agentic-eco.com)
- [GitHub](https://github.com/agentic-eco/agentic-client)
- [Issues](https://github.com/agentic-eco/agentic-client/issues)
- [NPM](https://www.npmjs.com/package/@agentic-eco/client)

## Support

For support, email support@agentic-eco.com or join our [Discord](https://discord.gg/agentic-eco).
