/**
 * Agent Client
 * Handles agent registration, discovery, and management
 */

import type {
  ClientConfig,
  AgentCreateRequest,
  AgentSearchFilters,
  AgentInfo,
} from './types';
import { AgentRegistry } from '../registry/agent-registry.service';
import { createLogger } from '../utils';
import type { AgentDefinition, AgentStatus, AgentCategory } from '../types';

const logger = createLogger('AgentClient');

/**
 * Client for agent operations
 */
export class AgentClient {
  private registry: AgentRegistry;
  private config: Required<ClientConfig>;

  constructor(
    config: Required<ClientConfig>,
    agentRegistry?: AgentRegistry
  ) {
    this.config = config;
    this.registry = agentRegistry || new AgentRegistry();
    logger.info('AgentClient initialized');
  }

  /**
   * Create and register a new agent
   */
  async create(request: AgentCreateRequest): Promise<{
    success: boolean;
    agent?: AgentInfo;
    error?: string;
  }> {
    try {
      logger.info('Creating agent', { ref: request.ref, name: request.name });

      const pricingType = request.pricing.type === 'per-token' ? 'per-unit' : request.pricing.type;
      
      // Create agent definition
      const agentDef: any = {
        ref: request.ref,
        name: request.name,
        description: request.description,
        category: request.category as AgentCategory,
        version: request.version,
        ownerId: request.ownerWallet, // Using ownerWallet as ownerId
        ownerWallet: request.ownerWallet,
        endpointType: request.endpointType,
        endpointUrl: request.endpointUrl,
        pricing: {
          type: pricingType,
          amount: request.pricing.amount,
          token: request.pricing.token,
          chain: request.pricing.chain,
        },
        inputSchema: request.inputSchema as any,
        outputSchema: request.outputSchema as any,
        tags: request.tags || [],
        supportedChains: request.supportedChains || [request.pricing.chain],
        supportedTokens: request.supportedTokens || [request.pricing.token],
      };
      
      const agent = await this.registry.createAgent(agentDef);

      return {
        success: true,
        agent: this.toAgentInfo(agent),
      };
    } catch (error) {
      logger.error('Failed to create agent', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Publish an agent (make it active)
   */
  async publish(agentRef: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Publishing agent', { agentRef });
      await this.registry.publishAgent(agentRef);
      return { success: true };
    } catch (error) {
      logger.error('Failed to publish agent', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unpublish an agent (make it inactive)
   * Note: This functionality needs to be implemented in AgentRegistry
   */
  async unpublish(agentRef: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Unpublishing agent', { agentRef });
      // TODO: Implement unpublishAgent in AgentRegistry
      logger.warn('Unpublish not yet implemented in AgentRegistry');
      return { 
        success: false,
        error: 'Unpublish functionality not yet implemented'
      };
    } catch (error) {
      logger.error('Failed to unpublish agent', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search and filter agents
   */
  async search(filters: AgentSearchFilters = {}): Promise<{
    agents: AgentInfo[];
    total: number;
  }> {
    try {
      logger.info('Searching agents', filters);

      // Build filter options
      const filterOptions: any = {};
      if (filters.category) filterOptions.category = filters.category;
      if (filters.chain) filterOptions.chain = filters.chain;
      if (filters.token) filterOptions.token = filters.token;
      if (filters.tag) filterOptions.tag = filters.tag;
      if (filters.status) {
        filterOptions.status = filters.status === 'active' ? 'active' : 'inactive';
      }

      // Get agents from registry
      const agents = await this.registry.listAgents(filterOptions);

      // Apply additional filters
      let filtered = agents;

      // Price range filter
      if (filters.minPrice || filters.maxPrice) {
        filtered = filtered.filter((agent: AgentDefinition) => {
          const price = parseFloat(agent.pricing.amount);
          if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
          if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
          return true;
        });
      }

      // Text search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((agent: AgentDefinition) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.ref.toLowerCase().includes(searchLower) ||
          agent.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      return {
        agents: filtered.map((a: AgentDefinition) => this.toAgentInfo(a)),
        total: filtered.length,
      };
    } catch (error) {
      logger.error('Failed to search agents', error);
      return {
        agents: [],
        total: 0,
      };
    }
  }

  /**
   * Get agent by reference
   */
  async get(agentRef: string): Promise<AgentInfo | null> {
    try {
      logger.info('Getting agent', { agentRef });
      const agent = await this.registry.getAgent(agentRef);
      return agent ? this.toAgentInfo(agent) : null;
    } catch (error) {
      logger.error('Failed to get agent', error);
      return null;
    }
  }

  /**
   * Delete an agent
   */
  async delete(agentRef: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Deleting agent', { agentRef });
      await this.registry.deleteAgent(agentRef);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete agent', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all categories
   */
  getCategories(): string[] {
    return [
      'data-processing',
      'ai-ml',
      'web-scraping',
      'api-integration',
      'blockchain',
      'other',
    ];
  }

  /**
   * Convert internal AgentDefinition to AgentInfo
   */
  private toAgentInfo(agent: AgentDefinition): AgentInfo {
    // Map AgentStatus to simplified active/inactive
    const status = agent.status === 'published' ? 'active' : 'inactive';
    
    return {
      ref: agent.ref,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      version: agent.version,
      ownerWallet: agent.ownerWallet,
      status,
      endpointUrl: agent.endpointUrl || '',
      pricing: {
        type: agent.pricing.type,
        amount: agent.pricing.amount,
        token: agent.pricing.token,
        chain: agent.pricing.chain,
      },
      tags: agent.tags,
      supportedChains: agent.supportedChains,
      supportedTokens: agent.supportedTokens,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      stats: {
        totalCalls: 0, // Would come from metrics service
        successRate: 100,
        avgResponseTime: 0,
      },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Required<ClientConfig>): void {
    this.config = config;
  }
}
