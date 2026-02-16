/**
 * Standalone Workflow YAML Parser
 * Parses and validates YAML workflow definitions without backend dependencies
 */

import { parse, stringify } from 'yaml';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowInput,
  WorkflowOutput,
  RetryConfig,
  ParseResult,
  ValidationError,
} from './types';

export class WorkflowYAMLParser {
  /**
   * Parse YAML string into WorkflowDefinition
   */
  parse(yamlContent: string): ParseResult {
    try {
      const parsed = parse(yamlContent);
      
      if (!parsed || typeof parsed !== 'object') {
        return {
          valid: false,
          errors: [{ type: 'syntax', message: 'Invalid YAML format' }],
        };
      }

      // Validate structure
      const validationErrors = this.validate(parsed);
      if (validationErrors.length > 0) {
        return {
          valid: false,
          errors: validationErrors,
        };
      }

      // Convert to WorkflowDefinition
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

  /**
   * Validate parsed YAML structure
   */
  private validate(parsed: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!parsed.name) {
      errors.push({ type: 'validation', message: 'Workflow name is required' });
    }
    if (!parsed.version) {
      errors.push({ type: 'validation', message: 'Workflow version is required' });
    }
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      errors.push({ type: 'validation', message: 'Workflow must have nodes array' });
    }

    // Validate nodes
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
          // Check for duplicate IDs
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

    // Validate edges
    if (parsed.edges && Array.isArray(parsed.edges)) {
      const nodeIds = new Set((parsed.nodes || []).map((n: any) => n.id));
      // Add "output" as a special valid target
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

    // Validate budget
    if (parsed.maxBudget) {
      const budget = parseFloat(parsed.maxBudget);
      if (isNaN(budget) || budget <= 0) {
        errors.push({
          type: 'validation',
          message: 'maxBudget must be a positive number',
          path: 'maxBudget',
        });
      }
    }

    return errors;
  }

  /**
   * Convert parsed YAML to WorkflowDefinition
   */
  private toWorkflowDefinition(parsed: any): WorkflowDefinition {
    return {
      name: parsed.name,
      version: parsed.version,
      description: parsed.description || '',
      chain: parsed.chain || 'base',
      token: parsed.token || parsed.budgetToken || 'USDC',
      maxBudget: parsed.maxBudget?.toString() || '0',
      inputs: this.parseInputs(parsed.inputs || {}),
      outputs: this.parseOutputs(parsed.outputs || {}),
      nodes: this.parseNodes(parsed.nodes || []),
      edges: this.parseEdges(parsed.edges || []),
      metadata: {
        tags: parsed.tags || parsed.metadata?.tags || [],
        author: parsed.author || parsed.metadata?.author,
        createdAt: parsed.createdAt || parsed.metadata?.createdAt || new Date().toISOString(),
        ...(parsed.metadata || {}),
      },
    };
  }

  /**
   * Parse workflow inputs
   */
  private parseInputs(inputs: any): Record<string, WorkflowInput> {
    const result: Record<string, WorkflowInput> = {};
    
    for (const [key, value] of Object.entries(inputs)) {
      const input = value as any;
      result[key] = {
        type: input.type || 'string',
        description: input.description || '',
        required: input.required !== false,
        default: input.default,
      };
    }
    
    return result;
  }

  /**
   * Parse workflow outputs
   */
  private parseOutputs(outputs: any): Record<string, WorkflowOutput> {
    const result: Record<string, WorkflowOutput> = {};
    
    for (const [key, value] of Object.entries(outputs)) {
      const output = value as any;
      result[key] = {
        type: output.type || 'string',
        description: output.description || '',
        value: output.value || `{{${key}}}`,
      };
    }
    
    return result;
  }

  /**
   * Parse workflow nodes
   */
  private parseNodes(nodes: any[]): WorkflowNode[] {
    return nodes.map((node: any) => ({
      id: node.id,
      ref: node.ref,
      name: node.name || node.id,
      description: node.description || '',
      inputs: node.inputs || {},
      retry: node.retry ? this.parseRetry(node.retry) : undefined,
    }));
  }

  /**
   * Parse retry configuration
   */
  private parseRetry(retry: any): RetryConfig {
    return {
      maxAttempts: retry.maxAttempts || 3,
      backoffMs: retry.backoffMs || 1000,
    };
  }

  /**
   * Parse workflow edges
   */
  private parseEdges(edges: any[]): WorkflowEdge[] {
    return edges.map((edge: any) => ({
      from: edge.from,
      to: edge.to,
      condition: edge.condition,
    }));
  }

  /**
   * Stringify WorkflowDefinition to YAML
   */
  stringify(workflow: WorkflowDefinition): string {
    const obj: any = {
      name: workflow.name,
      version: workflow.version,
      description: workflow.description,
      chain: workflow.chain,
      token: workflow.token,
      maxBudget: workflow.maxBudget,
    };

    // Add metadata tags at root level
    if (workflow.metadata?.tags && workflow.metadata.tags.length > 0) {
      obj.tags = workflow.metadata.tags;
    }

    // Add metadata fields at root level
    if (workflow.metadata?.author) {
      obj.author = workflow.metadata.author;
    }

    // Add inputs
    if (Object.keys(workflow.inputs).length > 0) {
      obj.inputs = workflow.inputs;
    }

    // Add outputs
    if (Object.keys(workflow.outputs).length > 0) {
      obj.outputs = workflow.outputs;
    }

    // Add nodes
    obj.nodes = workflow.nodes;

    // Add edges
    if (workflow.edges.length > 0) {
      obj.edges = workflow.edges;
    }

    // Use the yaml library's stringify instead of custom formatter
    return stringify(obj);
  }

  /**
   * Generate a template workflow YAML
   */
  generateTemplate(): string {
    return `name: "My Workflow"
description: "Sample workflow description"
version: "1.0.0"
chain: "base"
token: "USDC"
maxBudget: "5.0"
tags:
  - sample
  - demo

inputs:
  text:
    type: string
    description: Input text to process
    required: true

outputs:
  result:
    type: string
    description: Processed result
    value: "{{process_step.output}}"

nodes:
  - id: process_step
    ref: text-processor-v1
    name: "Process Text"
    description: "Process the input text"
    inputs:
      text: "{{inputs.text}}"
    retry:
      maxAttempts: 3
      backoffMs: 1000

edges:
  - from: process_step
    to: output
`;
  }
}
