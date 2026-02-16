/**
 * Frontend Client Types
 * Simplified type definitions for frontend integration
 */

import type { ChainType, TokenSymbol } from '../types/chain.types';

/**
 * Client Configuration
 */
export interface ClientConfig {
  apiUrl?: string;
  defaultChain?: ChainType;
  defaultToken?: TokenSymbol;
  timeout?: number;
}

/**
 * Workflow Types
 */
export interface WorkflowCreateRequest {
  yaml: string;
  userId: string;
  validateOnly?: boolean;
}

export interface WorkflowExecuteRequest {
  workflowId?: string;
  yaml?: string;
  userId: string;
  userWallet: string;
  inputs: Record<string, any>;
  maxBudget?: string;
  chain?: ChainType;
  token?: TokenSymbol;
}

export type WorkflowExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionProgress {
  runId: string;
  status: WorkflowExecutionStatus;
  currentNode?: string;
  completedNodes: string[];
  totalNodes: number;
  outputs?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  elapsedMs?: number;
}

export interface WorkflowResult {
  runId: string;
  status: WorkflowExecutionStatus;
  outputs: Record<string, any>;
  executionTime: number;
  totalCost: string;
  nodeResults: Array<{
    nodeId: string;
    nodeName: string;
    status: 'success' | 'failed' | 'skipped';
    output?: any;
    error?: string;
    cost?: string;
    duration?: number;
  }>;
}

/**
 * Agent Types
 */
export interface AgentCreateRequest {
  ref: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ownerWallet: string;
  endpointType: 'http' | 'native';
  endpointUrl: string;
  pricing: {
    type: 'per-call' | 'per-token' | 'subscription';
    amount: string;
    token: TokenSymbol;
    chain: ChainType;
  };
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  tags?: string[];
  supportedChains?: ChainType[];
  supportedTokens?: TokenSymbol[];
}

export interface AgentSearchFilters {
  category?: string;
  chain?: ChainType;
  token?: TokenSymbol;
  tag?: string;
  status?: 'active' | 'inactive';
  minPrice?: string;
  maxPrice?: string;
  search?: string;
}

export interface AgentInfo {
  ref: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ownerWallet: string;
  status: 'active' | 'inactive';
  endpointUrl: string;
  pricing: {
    type: string;
    amount: string;
    token: TokenSymbol;
    chain: ChainType;
  };
  tags: string[];
  supportedChains: ChainType[];
  supportedTokens: TokenSymbol[];
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    totalCalls?: number;
    successRate?: number;
    avgResponseTime?: number;
  };
}

/**
 * Payment Types
 */
export interface PaymentStatus {
  userId: string;
  availableBudget: string;
  reservedBudget: string;
  totalSpent: string;
  token: TokenSymbol;
  chain: ChainType;
}

export interface BudgetInfo {
  userId: string;
  userWallet: string;
  available: string;
  reserved: string;
  spent: string;
  token: TokenSymbol;
  chain: ChainType;
  reservations: Array<{
    runId: string;
    amount: string;
    createdAt: Date;
  }>;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Parse Result
 */
export interface ParseResult {
  valid: boolean;
  workflow?: {
    name: string;
    description: string;
    version: string;
    nodes: number;
    edges: number;
    estimatedCost?: string;
  };
  errors?: Array<{
    type: 'syntax' | 'validation' | 'semantic';
    message: string;
    line?: number;
    path?: string;
  }>;
}
