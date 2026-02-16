/**
 * Main Agentic Client
 * Unified client for all ecosystem operations
 */

import type { ClientConfig } from './types';
import { WorkflowClient } from './workflow-client';
import { AgentClient } from './agent-client';
import { PaymentClient } from './payment-client';
import { createLogger } from '../utils';

const logger = createLogger('AgenticClient');

/**
 * Main client for interacting with the Agentic Ecosystem
 */
export class AgenticClient {
  public readonly workflows: WorkflowClient;
  public readonly agents: AgentClient;
  public readonly payments: PaymentClient;

  private config: Required<ClientConfig>;

  constructor(config: ClientConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3000',
      defaultChain: config.defaultChain || 'base',
      defaultToken: config.defaultToken || 'USDC',
      timeout: config.timeout || 30000,
    };

    logger.info('Initializing Agentic Client', {
      apiUrl: this.config.apiUrl,
      defaultChain: this.config.defaultChain,
      defaultToken: this.config.defaultToken,
    });

    // Initialize sub-clients
    this.workflows = new WorkflowClient(this.config);
    this.agents = new AgentClient(this.config);
    this.payments = new PaymentClient(this.config);

    logger.info('✓ Agentic Client initialized');
  }

  /**
   * Get client configuration
   */
  getConfig(): Required<ClientConfig> {
    return { ...this.config };
  }

  /**
   * Update client configuration
   */
  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update sub-clients
    this.workflows.updateConfig(this.config);
    this.agents.updateConfig(this.config);
    this.payments.updateConfig(this.config);

    logger.info('Configuration updated', updates);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: {
      registry: boolean;
      execution: boolean;
      payment: boolean;
    };
    timestamp: Date;
  }> {
    try {
      // In a real implementation, this would call health endpoints
      return {
        status: 'healthy',
        services: {
          registry: true,
          execution: true,
          payment: true,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Health check failed', error);
      return {
        status: 'down',
        services: {
          registry: false,
          execution: false,
          payment: false,
        },
        timestamp: new Date(),
      };
    }
  }
}
