import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowYAMLParser } from '../yaml-parser';
import type { WorkflowDefinition } from '../types';

describe('WorkflowYAMLParser', () => {
  let parser: WorkflowYAMLParser;

  beforeEach(() => {
    parser = new WorkflowYAMLParser();
  });

  describe('parse', () => {
    it('should parse valid workflow YAML', () => {
      const yaml = `
name: "Test Workflow"
version: "1.0.0"
description: "A test workflow"
chain: "base"
token: "USDC"
maxBudget: "5.0"

inputs:
  text:
    type: string
    description: "Input text"
    required: true

outputs:
  result:
    type: string
    description: "Output result"
    value: "{{process.output}}"

nodes:
  - id: process
    ref: text-processor-v1
    name: "Process Text"
    description: "Process the input"
    inputs:
      text: "{{inputs.text}}"

edges:
  - from: process
    to: output
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.name).toBe('Test Workflow');
      expect(result.workflow?.version).toBe('1.0.0');
      expect(result.workflow?.nodes).toHaveLength(1);
      expect(result.workflow?.edges).toHaveLength(1);
      expect(result.errors).toBeUndefined();
    });

    it('should handle minimal valid workflow', () => {
      const yaml = `
name: "Minimal Workflow"
version: "1.0.0"
description: "Minimal valid workflow"
chain: "base"
token: "USDC"
maxBudget: "1.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}

edges: []
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.inputs).toEqual({});
      expect(result.workflow?.outputs).toEqual({});
    });

    it('should reject workflow with missing name', () => {
      const yaml = `
version: "1.0.0"
description: "Missing name"
chain: "base"
token: "USDC"
maxBudget: "1.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('name'))).toBe(true);
    });

    it('should reject workflow with missing version', () => {
      const yaml = `
name: "No Version"
description: "Missing version"
chain: "base"
token: "USDC"
maxBudget: "1.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('version'))).toBe(true);
    });

    it('should reject workflow with no nodes', () => {
      const yaml = `
name: "No Nodes"
version: "1.0.0"
description: "Missing nodes"
chain: "base"
token: "USDC"
maxBudget: "1.0"
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('nodes'))).toBe(true);
    });

    it('should reject workflow with duplicate node IDs', () => {
      const yaml = `
name: "Duplicate IDs"
version: "1.0.0"
description: "Duplicate node IDs"
chain: "base"
token: "USDC"
maxBudget: "1.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
  - id: step1
    ref: agent-v2
    name: "Step 1 Again"
    inputs: {}
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('should reject edge with invalid node reference', () => {
      const yaml = `
name: "Invalid Edge"
version: "1.0.0"
description: "Edge to nonexistent node"
chain: "base"
token: "USDC"
maxBudget: "1.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}

edges:
  - from: step1
    to: nonexistent
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('nonexistent'))).toBe(true);
    });

    it('should handle syntax errors gracefully', () => {
      const invalidYaml = `
name: "Bad YAML"
version: "1.0.0"
nodes:
  - id: step1
    ref: agent-v1
    inputs: {
      bad: json
`;

      const result = parser.parse(invalidYaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].type).toBe('syntax');
    });

    it('should parse workflow with retry configuration', () => {
      const yaml = `
name: "Retry Workflow"
version: "1.0.0"
description: "Workflow with retry"
chain: "base"
token: "USDC"
maxBudget: "5.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
    retry:
      maxAttempts: 3
      backoffMs: 1000
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow?.nodes[0].retry).toEqual({
        maxAttempts: 3,
        backoffMs: 1000,
      });
    });

    it('should parse workflow with metadata', () => {
      const yaml = `
name: "Metadata Workflow"
version: "1.0.0"
description: "Workflow with metadata"
chain: "base"
token: "USDC"
maxBudget: "5.0"

metadata:
  tags:
    - test
    - demo
  author: "tester"
  custom: "value"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow?.metadata?.tags).toEqual(['test', 'demo']);
      expect(result.workflow?.metadata?.author).toBe('tester');
    });

    it('should parse edge with condition', () => {
      const yaml = `
name: "Conditional Edge"
version: "1.0.0"
description: "Edge with condition"
chain: "base"
token: "USDC"
maxBudget: "5.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}
  - id: step2
    ref: agent-v2
    name: "Step 2"
    inputs: {}

edges:
  - from: step1
    to: step2
    condition: "{{step1.success}}"
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow?.edges[0].condition).toBe('{{step1.success}}');
    });
  });

  describe('stringify', () => {
    it('should generate valid YAML from workflow definition', () => {
      const workflow: WorkflowDefinition = {
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'A test workflow',
        chain: 'base',
        token: 'USDC',
        maxBudget: '5.0',
        inputs: {
          text: {
            type: 'string',
            description: 'Input text',
            required: true,
          },
        },
        outputs: {
          result: {
            type: 'string',
            description: 'Output result',
            value: '{{process.output}}',
          },
        },
        nodes: [
          {
            id: 'process',
            ref: 'text-processor-v1',
            name: 'Process Text',
            description: 'Process the input',
            inputs: {
              text: '{{inputs.text}}',
            },
          },
        ],
        edges: [
          {
            from: 'process',
            to: 'output',
          },
        ],
      };

      const yaml = parser.stringify(workflow);

      expect(yaml).toContain('name: Test Workflow');
      expect(yaml).toContain('version: 1.0.0');
      expect(yaml).toContain('chain: base');
      expect(yaml).toContain('token: USDC');
      expect(yaml).toContain('maxBudget: "5.0"');

      // Verify it can be parsed back
      const result = parser.parse(yaml);
      expect(result.valid).toBe(true);
    });

    it('should handle workflow without inputs/outputs', () => {
      const workflow: WorkflowDefinition = {
        name: 'Minimal',
        version: '1.0.0',
        description: 'Minimal workflow',
        chain: 'base',
        token: 'USDC',
        maxBudget: '1.0',
        inputs: {},
        outputs: {},
        nodes: [
          {
            id: 'step1',
            ref: 'agent-v1',
            name: 'Step 1',
            description: 'First step',
            inputs: {},
          },
        ],
        edges: [],
      };

      const yaml = parser.stringify(workflow);

      expect(yaml).toBeDefined();
      
      const result = parser.parse(yaml);
      expect(result.valid).toBe(true);
    });

    it('should preserve metadata in round-trip', () => {
      const workflow: WorkflowDefinition = {
        name: 'Metadata Test',
        version: '1.0.0',
        description: 'Test metadata',
        chain: 'base',
        token: 'USDC',
        maxBudget: '1.0',
        inputs: {},
        outputs: {},
        nodes: [
          {
            id: 'step1',
            ref: 'agent-v1',
            name: 'Step 1',
            description: 'First step',
            inputs: {},
          },
        ],
        edges: [],
        metadata: {
          tags: ['test', 'demo'],
          author: 'tester',
          version: '1.0',
        },
      };

      const yaml = parser.stringify(workflow);
      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow?.metadata?.tags).toEqual(['test', 'demo']);
      expect(result.workflow?.metadata?.author).toBe('tester');
    });
  });

  describe('generateTemplate', () => {
    it('should generate valid template YAML', () => {
      const template = parser.generateTemplate();

      expect(template).toContain('name:');
      expect(template).toContain('version:');
      expect(template).toContain('nodes:');

      // Verify template is valid
      const result = parser.parse(template);
      expect(result.valid).toBe(true);
    });

    it('should generate parseable template', () => {
      const template = parser.generateTemplate();
      const result = parser.parse(template);

      expect(result.valid).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = parser.parse('');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle whitespace only', () => {
      const result = parser.parse('   \n  \t  ');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle valid YAML that is not a workflow', () => {
      const yaml = `
just: some
random: yaml
that:
  is: not
  a: workflow
`;

      const result = parser.parse(yaml);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle large workflow', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `step${i}`,
        ref: `agent-v1`,
        name: `Step ${i}`,
        description: `Step ${i} description`,
        inputs: {},
      }));

      const edges = nodes.slice(0, -1).map((node, i) => ({
        from: node.id,
        to: nodes[i + 1].id,
      }));

      const workflow: WorkflowDefinition = {
        name: 'Large Workflow',
        version: '1.0.0',
        description: 'Workflow with many nodes',
        chain: 'base',
        token: 'USDC',
        maxBudget: '100.0',
        inputs: {},
        outputs: {},
        nodes,
        edges,
      };

      const yaml = parser.stringify(workflow);
      const result = parser.parse(yaml);

      expect(result.valid).toBe(true);
      expect(result.workflow?.nodes).toHaveLength(100);
      expect(result.workflow?.edges).toHaveLength(99);
    });
  });
});
