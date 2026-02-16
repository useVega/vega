/**
 * YAML Workflow Parser
 * Parses YAML DSL into WorkflowSpec
 */

import { parse } from 'yaml';
import type { WorkflowSpec, WorkflowNode, WorkflowEdge, DialogueConfig, WorkflowExecutionConfig } from '../types/workflow.types';
import type { AgentSchedule, AgentTickConfig } from '../types/agent.types';
import { WorkflowValidationError } from '../types/errors.types';

export interface WorkflowYAMLSpec {
  name: string;
  description: string;
  version: string;
  chain: string;
  token: string;
  maxBudget: string;
  entryNode: string;
  
  // Execution configuration
  execution?: {
    mode?: 'rounds' | 'ticks' | 'scheduled' | 'dialogue';
    rounds?: number;
    schedule?: {
      startTime?: string;
      endTime?: string;
      timezone?: string;
      daysOfWeek?: number[];
    };
    ticks?: {
      enabled: boolean;
      intervalMs?: number;
      intervalSeconds?: number;
      intervalMinutes?: number;
      maxTicksPerRound?: number;
    };
  };
  
  nodes: {
    [id: string]: {
      type: string;
      agent?: string;
      name: string;
      inputs?: Record<string, any>;
      condition?: string;
      retry?: {
        maxAttempts: number;
        backoffMs: number;
      };
      schedule?: {
        startTime?: string;
        endTime?: string;
        timezone?: string;
        daysOfWeek?: number[];
      };
      ticks?: {
        enabled: boolean;
        intervalMs?: number;
        intervalSeconds?: number;
        intervalMinutes?: number;
        maxTicksPerRound?: number;
      };
      dialogue?: {
        mode: 'sequential' | 'round-robin' | 'dynamic';
        participants: string[];
        turns: Array<{
          speaker: string;
          prompt: string;
          respondTo?: string[];
        }>;
        maxTurns?: number;
        endCondition?: string;
      };
    };
  } | Array<{
    id: string;
    type?: string;
    ref?: string;
    name: string;
    description?: string;
    inputs?: Record<string, any>;
    condition?: string;
    retry?: {
      maxAttempts: number;
      backoffMs: number;
    };
    schedule?: {
      startTime?: string;
      endTime?: string;
      timezone?: string;
      daysOfWeek?: number[];
    };
    ticks?: {
      enabled: boolean;
      intervalMs?: number;
      intervalSeconds?: number;
      intervalMinutes?: number;
      maxTicksPerRound?: number;
    };
    dialogue?: {
      mode: 'sequential' | 'round-robin' | 'dynamic';
      participants: string[];
      turns: Array<{
        speaker: string;
        prompt: string;
        respondTo?: string[];
      }>;
      maxTurns?: number;
      endCondition?: string;
    };
  }>;
  edges: Array<{
    from: string;
    to: string;
    condition?: string;
  }>;
  tags?: string[];
}

export class WorkflowYAMLParser {
  /**
   * Parse YAML string into WorkflowSpec
   */
  parse(yamlContent: string, userId: string): WorkflowSpec {
    try {
      const yaml = parse(yamlContent) as WorkflowYAMLSpec;
      return this.yamlToWorkflowSpec(yaml, userId);
    } catch (error) {
      throw new WorkflowValidationError(
        `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Convert YAML object to WorkflowSpec
   */
  private yamlToWorkflowSpec(yaml: WorkflowYAMLSpec, userId: string): WorkflowSpec {
    // Validate required fields
    this.validateYAML(yaml);

    // Convert nodes - handle both object and array formats
    let nodes: WorkflowNode[];
    
    if (Array.isArray(yaml.nodes)) {
      // Array format
      nodes = yaml.nodes.map(node => {
        const workflowNode: WorkflowNode = {
          id: node.id,
          type: (node.type || 'agent') as any,
          agentRef: node.ref,
          name: node.name,
          inputs: node.inputs || {},
          condition: node.condition,
          retryPolicy: node.retry,
        };
        
        // Add schedule if present
        if (node.schedule) {
          workflowNode.schedule = this.parseSchedule(node.schedule);
        }
        
        // Add tick config if present
        if (node.ticks) {
          workflowNode.tickConfig = this.parseTickConfig(node.ticks);
        }
        
        // Add dialogue config if present
        if (node.dialogue) {
          workflowNode.dialogue = node.dialogue as DialogueConfig;
        }
        
        return workflowNode;
      });
    } else {
      // Object format
      nodes = Object.entries(yaml.nodes).map(([id, node]) => {
        const workflowNode: WorkflowNode = {
          id,
          type: node.type as any,
          agentRef: node.agent,
          name: node.name,
          inputs: node.inputs || {},
          condition: node.condition,
          retryPolicy: node.retry,
        };
        
        // Add schedule if present
        if (node.schedule) {
          workflowNode.schedule = this.parseSchedule(node.schedule);
        }
        
        // Add tick config if present
        if (node.ticks) {
          workflowNode.tickConfig = this.parseTickConfig(node.ticks);
        }
        
        // Add dialogue config if present
        if (node.dialogue) {
          workflowNode.dialogue = node.dialogue as DialogueConfig;
        }
        
        return workflowNode;
      });
    }

    // Convert edges
    const edges: WorkflowEdge[] = yaml.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      condition: edge.condition,
    }));

    // Generate workflow ID
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse execution config
    const executionConfig: WorkflowExecutionConfig | undefined = yaml.execution ? {
      mode: yaml.execution.mode,
      rounds: yaml.execution.rounds,
      schedule: yaml.execution.schedule ? this.parseSchedule(yaml.execution.schedule) : undefined,
      tickConfig: yaml.execution.ticks ? this.parseTickConfig(yaml.execution.ticks) : undefined,
    } : undefined;

    return {
      id: workflowId,
      name: yaml.name,
      description: yaml.description,
      version: yaml.version,
      userId,
      chain: yaml.chain as any,
      token: yaml.token as any,
      maxBudget: yaml.maxBudget,
      nodes,
      edges,
      entryNodeId: yaml.entryNode,
      executionConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: yaml.tags || [],
    };
  }
  
  /**
   * Parse schedule configuration
   */
  private parseSchedule(schedule: any): AgentSchedule {
    return {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      timezone: schedule.timezone || 'UTC',
      daysOfWeek: schedule.daysOfWeek,
    };
  }
  
  /**
   * Parse tick configuration
   */
  private parseTickConfig(ticks: any): AgentTickConfig {
    const config: AgentTickConfig = {
      enabled: ticks.enabled,
    };
    
    // Convert convenience formats to milliseconds
    if (ticks.intervalMs) {
      config.intervalMs = ticks.intervalMs;
    } else if (ticks.intervalSeconds) {
      config.intervalMs = ticks.intervalSeconds * 1000;
      config.intervalSeconds = ticks.intervalSeconds;
    } else if (ticks.intervalMinutes) {
      config.intervalMs = ticks.intervalMinutes * 60 * 1000;
      config.intervalMinutes = ticks.intervalMinutes;
    }
    
    if (ticks.maxTicksPerRound) {
      config.maxTicksPerRound = ticks.maxTicksPerRound;
    }
    
    return config;
  }

  /**
   * Validate YAML structure
   */
  private validateYAML(yaml: WorkflowYAMLSpec): void {
    if (!yaml.name) {
      throw new WorkflowValidationError('Workflow name is required');
    }

    if (!yaml.chain || !yaml.token) {
      throw new WorkflowValidationError('Chain and token are required');
    }

    if (!yaml.maxBudget) {
      throw new WorkflowValidationError('maxBudget is required');
    }

    if (!yaml.nodes) {
      throw new WorkflowValidationError('Workflow must have at least one node');
    }
    
    // Handle both array and object formats
    const nodeCount = Array.isArray(yaml.nodes) ? yaml.nodes.length : Object.keys(yaml.nodes).length;
    if (nodeCount === 0) {
      throw new WorkflowValidationError('Workflow must have at least one node');
    }

    if (!yaml.entryNode) {
      throw new WorkflowValidationError('entryNode is required');
    }

    // Check if entry node exists
    if (Array.isArray(yaml.nodes)) {
      const entryNodeExists = yaml.nodes.some(n => n.id === yaml.entryNode);
      if (!entryNodeExists) {
        throw new WorkflowValidationError(`Entry node ${yaml.entryNode} does not exist`);
      }
    } else {
      if (!yaml.nodes[yaml.entryNode]) {
        throw new WorkflowValidationError(`Entry node ${yaml.entryNode} does not exist`);
      }
    }

    // Validate edges reference existing nodes
    if (yaml.edges) {
      for (const edge of yaml.edges) {
        if (Array.isArray(yaml.nodes)) {
          const fromExists = yaml.nodes.some(n => n.id === edge.from);
          const toExists = yaml.nodes.some(n => n.id === edge.to);
          
          if (!fromExists) {
            throw new WorkflowValidationError(`Edge references non-existent node: ${edge.from}`);
          }
          if (!toExists) {
            throw new WorkflowValidationError(`Edge references non-existent node: ${edge.to}`);
          }
        } else {
          if (!yaml.nodes[edge.from]) {
            throw new WorkflowValidationError(`Edge references non-existent node: ${edge.from}`);
          }
          if (!yaml.nodes[edge.to]) {
            throw new WorkflowValidationError(`Edge references non-existent node: ${edge.to}`);
          }
        }
      }
    }
  }

  /**
   * Generate sample YAML template
   */
  generateTemplate(): string {
    return `name: "My Workflow"
description: "Sample workflow description"
version: "1.0.0"
chain: "base"
token: "USDC"
maxBudget: "5.0"
entryNode: "node1"
tags:
  - sample
  - demo

nodes:
  node1:
    type: agent
    agent: text-summarizer-v1
    name: "Summarize Text"
    inputs:
      text: "{{input.text}}"
      maxLength: 100
    retry:
      maxAttempts: 3
      backoffMs: 1000
      
  node2:
    type: agent
    agent: sentiment-analyzer-v1
    name: "Analyze Sentiment"
    inputs:
      text: "{{node1.output}}"

edges:
  - from: node1
    to: node2
`;
  }
}
