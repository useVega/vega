import chalk from 'chalk';
import { logger } from './logger.js';
import type { WorkflowDefinition } from './parser.js';
import axios from 'axios';

interface ExecutionOptions {
  verbose?: boolean;
}

interface NodeResult {
  id: string;
  status: 'completed' | 'failed' | 'pending';
  output?: any;
  error?: string;
  duration?: number;
}

interface ExecutionResult {
  status: 'completed' | 'failed' | 'running';
  nodeResults: NodeResult[];
  outputs?: Record<string, any>;
  error?: string;
}

export class ExecutionEngine {
  private workflow: WorkflowDefinition;
  private options: ExecutionOptions;

  constructor(workflow: WorkflowDefinition, options: ExecutionOptions = {}) {
    this.workflow = workflow;
    this.options = options;
  }

  async execute(inputs: Record<string, any>): Promise<ExecutionResult> {
    const nodeResults: NodeResult[] = [];

    try {
      if (this.options.verbose) {
        logger.info('Starting workflow execution');
        logger.debug(`Inputs: ${JSON.stringify(inputs)}`);
      }

      // Execute nodes in order
      for (const node of this.workflow.nodes) {
        if (this.options.verbose) {
          console.log();
          console.log(chalk.cyan(`Executing node: ${node.id}`));
          console.log(chalk.gray(`  Agent: ${node.ref}`));
          console.log(chalk.gray(`  Name:  ${node.name}`));
        } else {
          // Show dialogue format
          console.log();
          const agentName = node.ref.includes('ceo') ? '💼 CEO' : 
                          node.ref.includes('cto') ? '💻 CTO' : 
                          node.ref.includes('cmo') ? '📢 CMO' : 
                          node.ref.includes('summarizer') ? '📝 Summarizer' : '🤖 Agent';
          console.log(chalk.bold.cyan(`${agentName} (${node.name}):`));
          console.log(chalk.gray('─'.repeat(80)));
        }

        const startTime = Date.now();

        try {
          // Simulate agent execution
          const output = await this.executeNode(node, inputs, nodeResults);
          const duration = Date.now() - startTime;

          nodeResults.push({
            id: node.id,
            status: 'completed',
            output,
            duration,
          });

          if (this.options.verbose) {
            console.log(chalk.green(`  ✓ Completed in ${duration}ms`));
            console.log(chalk.gray(`  Output: ${JSON.stringify(output).slice(0, 100)}...`));
          } else {
            // Display agent response in dialogue format
            const response = output.response || output.summary || output.output || JSON.stringify(output);
            console.log(chalk.white(response));
            console.log();
            console.log(chalk.gray(`⏱  ${(duration / 1000).toFixed(1)}s`));
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          nodeResults.push({
            id: node.id,
            status: 'failed',
            error: errorMessage,
            duration,
          });

          if (this.options.verbose) {
            console.log(chalk.red(`  ✗ Failed after ${duration}ms`));
            console.log(chalk.red(`  Error: ${errorMessage}`));
          }

          return {
            status: 'failed',
            nodeResults,
            error: `Node ${node.id} failed: ${errorMessage}`,
          };
        }
      }

      // Compute final outputs
      const outputs = this.computeOutputs(nodeResults);

      return {
        status: 'completed',
        nodeResults,
        outputs,
      };
    } catch (error) {
      return {
        status: 'failed',
        nodeResults,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeNode(
    node: any,
    workflowInputs: Record<string, any>,
    previousResults: NodeResult[]
  ): Promise<any> {
    // Resolve node inputs from workflow inputs and previous node outputs
    const resolvedInputs = this.resolveInputs(
      node.inputs,
      workflowInputs,
      previousResults
    );

    // Map agent refs to endpoints
    const agentEndpoints: Record<string, string> = {
      'ceo-agent-v1': 'http://localhost:3010/execute',
      'cto-agent-v1': 'http://localhost:3011/execute',
      'cmo-agent-v1': 'http://localhost:3012/execute',
      'summarizer-agent-v1': 'http://localhost:3013/execute',
      'text-transformer-v1': 'http://localhost:3002/execute',
      'echo-agent-v1': 'http://localhost:3001/execute',
    };

    const endpoint = agentEndpoints[node.ref];
    
    if (endpoint) {
      try {
        // Call real agent endpoint
        const response = await axios.post(endpoint, resolvedInputs, {
          timeout: 120000, // 120 second timeout for AI processing
          headers: {
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Agent call failed: ${error.message}`);
        }
        throw error;
      }
    } else {
      // Fallback for unknown agents
      return {
        success: true,
        output: `Output from ${node.id}`,
        data: resolvedInputs,
      };
    }
  }

  private resolveInputs(
    nodeInputs: Record<string, any>,
    workflowInputs: Record<string, any>,
    previousResults: NodeResult[]
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(nodeInputs)) {
      if (Array.isArray(value)) {
        // Handle arrays (like discussion array)
        resolved[key] = value.map(item => {
          if (typeof item === 'string' && item.includes('{{')) {
            return this.resolveTemplateString(item, workflowInputs, previousResults);
          }
          return item;
        });
      } else if (typeof value === 'string' && value.includes('{{')) {
        // Template resolution for strings
        resolved[key] = this.resolveTemplateString(value, workflowInputs, previousResults);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private resolveTemplateString(
    template: string,
    workflowInputs: Record<string, any>,
    previousResults: NodeResult[]
  ): string {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return template;

    let resolvedValue = template;
    for (const match of matches) {
      const path = match.slice(2, -2).trim();
      const parts = path.split('.');

      if (parts[0] === 'inputs') {
        // Workflow input
        const inputKey = parts[1];
        if (inputKey in workflowInputs) {
          resolvedValue = resolvedValue.replace(match, String(workflowInputs[inputKey]));
        }
      } else {
        // Previous node output
        const nodeId = parts[0];
        const outputKey = parts[1];
        const nodeResult = previousResults.find(r => r.id === nodeId);
        if (nodeResult?.output) {
          const outputValue = outputKey 
            ? nodeResult.output[outputKey] 
            : nodeResult.output;
          
          // If it's a simple value, use it directly; otherwise stringify
          const valueStr = typeof outputValue === 'string' 
            ? outputValue 
            : JSON.stringify(outputValue);
          resolvedValue = resolvedValue.replace(match, valueStr);
        }
      }
    }
    
    return resolvedValue;
  }

  private computeOutputs(nodeResults: NodeResult[]): Record<string, any> {
    const outputs: Record<string, any> = {};

    for (const [key, outputDef] of Object.entries(this.workflow.outputs)) {
      const value = (outputDef as any).value;
      if (typeof value === 'string' && value.includes('{{')) {
        const match = value.match(/\{\{([^}]+)\}\}/);
        if (match) {
          const path = match[1].trim();
          const parts = path.split('.');
          const nodeId = parts[0];
          const outputKey = parts[1];
          
          const nodeResult = nodeResults.find(r => r.id === nodeId);
          if (nodeResult?.output) {
            const output = nodeResult.output;
            if (outputKey) {
              // Extract nested property
              outputs[key] = output[outputKey];
            } else {
              // Use entire output
              outputs[key] = output;
            }
          }
        }
      } else {
        outputs[key] = value;
      }
    }

    return outputs;
  }
}
