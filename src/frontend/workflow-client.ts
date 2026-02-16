/**
 * Workflow Client
 * Handles workflow parsing, validation, and execution
 */

import type {
  ClientConfig,
  WorkflowCreateRequest,
  WorkflowExecuteRequest,
  WorkflowResult,
  ExecutionProgress,
  ParseResult,
} from './types';
import { WorkflowYAMLParser } from '../workflow/yaml-parser.service';
import { WorkflowValidator } from '../workflow/workflow-validator.service';
import { WorkflowScheduler } from '../workflow/workflow-scheduler.service';
import { WorkflowExecutionEngine } from '../execution/execution-engine.service';
import { AgentRegistry } from '../registry/agent-registry.service';
import { BudgetManager } from '../payment/budget-manager.service';
import { A2AAgentCaller } from '../execution/a2a-agent-caller.service';
import { createLogger } from '../utils';
import type { WorkflowSpec, WorkflowRun } from '../types';

const logger = createLogger('WorkflowClient');

/**
 * Client for workflow operations
 */
export class WorkflowClient {
  private parser: WorkflowYAMLParser;
  private validator: WorkflowValidator;
  private scheduler: WorkflowScheduler;
  private executor: WorkflowExecutionEngine;
  private config: Required<ClientConfig>;

  // Active runs tracking
  private activeRuns = new Map<string, WorkflowRun>();

  constructor(
    config: Required<ClientConfig>,
    agentRegistry?: AgentRegistry,
    budgetManager?: BudgetManager,
    agentCaller?: A2AAgentCaller
  ) {
    this.config = config;
    this.parser = new WorkflowYAMLParser();
    
    // Use provided instances or create new ones
    const registry = agentRegistry || new AgentRegistry();
    const budget = budgetManager || new BudgetManager();
    const caller = agentCaller || new A2AAgentCaller();
    
    this.validator = new WorkflowValidator(registry);
    this.scheduler = new WorkflowScheduler(budget);
    this.executor = new WorkflowExecutionEngine(registry, caller);

    logger.info('WorkflowClient initialized');
  }

  /**
   * Parse and validate workflow YAML
   */
  async parse(yaml: string, userId: string): Promise<ParseResult> {
    try {
      logger.info('Parsing workflow YAML');

      // Parse YAML
      const workflow = this.parser.parse(yaml, userId);

      // Validate
      try {
        await this.validator.validate(workflow);
      } catch (error) {
        return {
          valid: false,
          errors: [{
            type: 'validation',
            message: error instanceof Error ? error.message : 'Validation failed',
          }],
        };
      }

      return {
        valid: true,
        workflow: {
          name: workflow.name,
          description: workflow.description,
          version: workflow.version,
          nodes: workflow.nodes.length,
          edges: workflow.edges.length,
          estimatedCost: workflow.maxBudget,
        },
      };
    } catch (error) {
      logger.error('Failed to parse workflow', error);
      return {
        valid: false,
        errors: [{
          type: 'syntax',
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        }],
      };
    }
  }

  /**
   * Create and validate a workflow
   */
  async create(request: WorkflowCreateRequest): Promise<{
    success: boolean;
    workflowId?: string;
    workflow?: WorkflowSpec;
    errors?: Array<{ message: string; path?: string }>;
  }> {
    try {
      logger.info('Creating workflow', { validateOnly: request.validateOnly });

      // Parse YAML
      const workflow = this.parser.parse(request.yaml, request.userId);

      // Validate
      try {
        await this.validator.validate(workflow);
      } catch (error) {
        return {
          success: false,
          errors: [{
            message: error instanceof Error ? error.message : 'Validation failed',
          }],
        };
      }

      if (request.validateOnly) {
        return {
          success: true,
          workflow,
        };
      }

      return {
        success: true,
        workflowId: workflow.id,
        workflow,
      };
    } catch (error) {
      logger.error('Failed to create workflow', error);
      return {
        success: false,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Execute a workflow
   */
  async execute(request: WorkflowExecuteRequest): Promise<{
    success: boolean;
    runId?: string;
    error?: string;
  }> {
    try {
      logger.info('Executing workflow', {
        userId: request.userId,
        hasWorkflowId: !!request.workflowId,
        hasYaml: !!request.yaml,
      });

      // Parse workflow if YAML provided
      let workflow: WorkflowSpec;
      if (request.yaml) {
        workflow = this.parser.parse(request.yaml, request.userId);
        
        // Override budget/chain/token if provided
        if (request.maxBudget) workflow.maxBudget = request.maxBudget;
        if (request.chain) workflow.chain = request.chain;
        if (request.token) workflow.token = request.token;
      } else if (request.workflowId) {
        throw new Error('Loading saved workflows not yet implemented');
      } else {
        throw new Error('Either workflowId or yaml must be provided');
      }

      // Validate
      try {
        await this.validator.validate(workflow);
      } catch (error) {
        throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
      }

      // Schedule run
      const run = await this.scheduler.scheduleRun({
        workflowSpec: workflow,
        userWallet: request.userWallet,
        inputs: request.inputs,
      });

      // Store active run
      this.activeRuns.set(run.runId, run);

      // Execute asynchronously
      this.executeAsync(workflow, run, request.inputs).catch(err => {
        logger.error('Async execution failed', { runId: run.runId, error: err });
      });

      return {
        success: true,
        runId: run.runId,
      };
    } catch (error) {
      logger.error('Failed to execute workflow', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute workflow asynchronously
   */
  private async executeAsync(
    workflow: WorkflowSpec,
    run: WorkflowRun,
    inputs?: Record<string, any>
  ): Promise<void> {
    try {
      logger.info('Starting async execution', { runId: run.runId });
      
      const result = await this.executor.executeRun(workflow, run, inputs);
      
      // Update active run
      this.activeRuns.set(run.runId, result);
      
      logger.info('Execution completed', {
        runId: run.runId,
        status: result.status,
      });
    } catch (error) {
      logger.error('Execution failed', { runId: run.runId, error });
      
      // Update run with error
      const failedRun = this.activeRuns.get(run.runId);
      if (failedRun) {
        failedRun.status = 'failed';
        failedRun.error = error instanceof Error ? error.message : 'Unknown error';
        this.activeRuns.set(run.runId, failedRun);
      }
    }
  }

  /**
   * Get execution progress
   */
  async getProgress(runId: string): Promise<ExecutionProgress | null> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      logger.warn('Run not found', { runId });
      return null;
    }

    const completedNodes: string[] = [];
    let currentNode: string | undefined;
    const totalNodes = 0; // Would need to track this properly

    // Map WorkflowRunStatus to WorkflowExecutionStatus
    const statusMap: Record<string, ExecutionProgress['status']> = {
      'queued': 'pending',
      'running': 'running',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
    };

    const status = statusMap[run.status] || 'pending';

    return {
      runId: run.runId,
      status,
      currentNode,
      completedNodes,
      totalNodes,
      outputs: run.output,
      error: run.error,
      startedAt: run.startedAt || new Date(),
      completedAt: run.endedAt,
      elapsedMs: run.endedAt && run.startedAt
        ? run.endedAt.getTime() - run.startedAt.getTime()
        : run.startedAt ? Date.now() - run.startedAt.getTime() : 0,
    };
  }

  /**
   * Get workflow result
   */
  async getResult(runId: string): Promise<WorkflowResult | null> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      logger.warn('Run not found', { runId });
      return null;
    }

    if (run.status !== 'completed' && run.status !== 'failed') {
      logger.warn('Run not finished', { runId, status: run.status });
      return null;
    }

    // Map WorkflowRunStatus to WorkflowExecutionStatus
    const statusMap: Record<string, WorkflowResult['status']> = {
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'queued': 'pending',
      'running': 'running',
    };

    return {
      runId: run.runId,
      status: statusMap[run.status] || 'failed',
      outputs: run.output || {},
      executionTime: run.endedAt && run.startedAt
        ? run.endedAt.getTime() - run.startedAt.getTime()
        : 0,
      totalCost: run.spentBudget || '0',
      nodeResults: [], // Would need proper node tracking
    };
  }

  /**
   * Cancel a running workflow
   */
  async cancel(runId: string): Promise<boolean> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      logger.warn('Run not found', { runId });
      return false;
    }

    if (run.status !== 'running' && run.status !== 'queued') {
      logger.warn('Run cannot be cancelled', { runId, status: run.status });
      return false;
    }

    // Update status
    run.status = 'cancelled';
    run.error = 'Cancelled by user';
    run.endedAt = new Date();
    this.activeRuns.set(runId, run);

    logger.info('Run cancelled', { runId });
    return true;
  }

  /**
   * Generate workflow template
   */
  generateTemplate(): string {
    return this.parser.generateTemplate();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Required<ClientConfig>): void {
    this.config = config;
  }
}
