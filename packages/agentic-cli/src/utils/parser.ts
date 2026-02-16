import { parse, stringify } from 'yaml';

export interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;
  chain: string;
  token: string;
  maxBudget: string;
  tags?: string[];
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  ref: string;
  name: string;
  description: string;
  inputs: Record<string, any>;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface ParseResult {
  valid: boolean;
  workflow?: WorkflowDefinition;
  errors?: ValidationError[];
}

export interface ValidationError {
  type: 'syntax' | 'validation' | 'semantic';
  message: string;
  line?: number;
  path?: string;
}

export class WorkflowYAMLParser {
  parse(yamlContent: string): ParseResult {
    try {
      const parsed = parse(yamlContent);
      
      if (!parsed || typeof parsed !== 'object') {
        return {
          valid: false,
          errors: [{ type: 'syntax', message: 'Invalid YAML format' }],
        };
      }

      const validationErrors = this.validate(parsed);
      if (validationErrors.length > 0) {
        return {
          valid: false,
          errors: validationErrors,
        };
      }

      const workflow = this.toWorkflowDefinition(parsed);

      return {
        valid: true,
        workflow,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          type: 'syntax',
          message: error instanceof Error ? error.message : 'Failed to parse YAML',
        }],
      };
    }
  }

  private validate(parsed: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!parsed.name) {
      errors.push({ type: 'validation', message: 'Workflow name is required' });
    }
    if (!parsed.version) {
      errors.push({ type: 'validation', message: 'Workflow version is required' });
    }
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      errors.push({ type: 'validation', message: 'Workflow must have nodes array' });
    }

    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      const nodeIds = new Set<string>();
      parsed.nodes.forEach((node: any, index: number) => {
        if (!node.id) {
          errors.push({
            type: 'validation',
            message: `Node at index ${index} missing id`,
            path: `nodes[${index}]`,
          });
        } else {
          if (nodeIds.has(node.id)) {
            errors.push({
              type: 'validation',
              message: `Duplicate node ID: ${node.id}`,
              path: `nodes[${index}].id`,
            });
          }
          nodeIds.add(node.id);
        }
        if (!node.ref) {
          errors.push({
            type: 'validation',
            message: `Node ${node.id || index} missing ref (agent reference)`,
            path: `nodes[${index}]`,
          });
        }
      });
    }

    if (parsed.edges && Array.isArray(parsed.edges)) {
      const nodeIds = new Set((parsed.nodes || []).map((n: any) => n.id));
      nodeIds.add('output');
      
      parsed.edges.forEach((edge: any, index: number) => {
        if (!edge.from) {
          errors.push({
            type: 'validation',
            message: `Edge at index ${index} missing 'from' field`,
            path: `edges[${index}]`,
          });
        }
        if (!edge.to) {
          errors.push({
            type: 'validation',
            message: `Edge at index ${index} missing 'to' field`,
            path: `edges[${index}]`,
          });
        }
        if (edge.from && !nodeIds.has(edge.from)) {
          errors.push({
            type: 'validation',
            message: `Edge references non-existent node: ${edge.from}`,
            path: `edges[${index}].from`,
          });
        }
        if (edge.to && !nodeIds.has(edge.to)) {
          errors.push({
            type: 'validation',
            message: `Edge references non-existent node: ${edge.to}`,
            path: `edges[${index}].to`,
          });
        }
      });
    }

    return errors;
  }

  private toWorkflowDefinition(parsed: any): WorkflowDefinition {
    return {
      name: parsed.name,
      version: parsed.version,
      description: parsed.description || '',
      chain: parsed.chain || 'base',
      token: parsed.token || 'USDC',
      maxBudget: parsed.maxBudget?.toString() || '0',
      tags: parsed.tags || [],
      inputs: parsed.inputs || {},
      outputs: parsed.outputs || {},
      nodes: (parsed.nodes || []).map((node: any) => ({
        id: node.id,
        ref: node.ref,
        name: node.name || node.id,
        description: node.description || '',
        inputs: node.inputs || {},
        retry: node.retry,
      })),
      edges: (parsed.edges || []).map((edge: any) => ({
        from: edge.from,
        to: edge.to,
        condition: edge.condition,
      })),
      metadata: parsed.metadata || {},
    };
  }

  stringify(workflow: WorkflowDefinition): string {
    const obj: any = {
      name: workflow.name,
      version: workflow.version,
      description: workflow.description,
      chain: workflow.chain,
      token: workflow.token,
      maxBudget: workflow.maxBudget,
    };

    if (workflow.tags && workflow.tags.length > 0) {
      obj.tags = workflow.tags;
    }

    if (Object.keys(workflow.inputs).length > 0) {
      obj.inputs = workflow.inputs;
    }

    if (Object.keys(workflow.outputs).length > 0) {
      obj.outputs = workflow.outputs;
    }

    obj.nodes = workflow.nodes;

    if (workflow.edges.length > 0) {
      obj.edges = workflow.edges;
    }

    return stringify(obj);
  }

  generateTemplate(): string {
    const template: WorkflowDefinition = {
      name: 'My Workflow',
      version: '1.0.0',
      description: 'Workflow description',
      chain: 'base',
      token: 'USDC',
      maxBudget: '5.0',
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
      edges: [
        {
          from: 'step1',
          to: 'output',
        },
      ],
    };

    return this.stringify(template);
  }
}
