/**
 * Type Definitions for Agentic Client
 * Standalone types that don't depend on backend services
 */

// Chain and Token Types
export type ChainType = 'base' | 'arbitrum' | 'ethereum' | 'solana';
export type TokenSymbol = 'USDC' | 'USDT' | 'ETH' | 'SOL';

// Workflow Definition Types
export interface WorkflowDefinition {
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

export interface WorkflowInput {
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface WorkflowOutput {
  type: string;
  description: string;
  value: string;
}

export interface WorkflowNode {
  id: string;
  ref: string; // Agent reference
  name: string;
  description: string;
  inputs: Record<string, any>;
  retry?: RetryConfig;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
}

export interface WorkflowMetadata {
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Parse Result Types
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

// Client Configuration
export interface ClientConfig {
  apiUrl?: string;
  defaultChain?: ChainType;
  defaultToken?: TokenSymbol;
  timeout?: number;
}

// Execution Types
export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionProgress {
  runId: string;
  status: ExecutionStatus;
  currentNode?: string;
  completedNodes: string[];
  totalNodes: number;
  outputs?: Record<string, any>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  elapsedMs?: number;
}

export interface ExecutionResult {
  runId: string;
  status: ExecutionStatus;
  outputs: Record<string, any>;
  executionTime: number;
  totalCost: string;
  nodeResults: NodeResult[];
}

export interface NodeResult {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  cost?: string;
  duration?: number;
}

// Agent Types
export interface AgentInfo {
  ref: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ownerWallet: string;
  status: 'active' | 'inactive';
  endpointUrl: string;
  pricing: AgentPricing;
  tags: string[];
  supportedChains: ChainType[];
  supportedTokens: TokenSymbol[];
  createdAt: string;
  updatedAt: string;
  stats?: AgentStats;
}

export interface AgentPricing {
  type: string;
  amount: string;
  token: TokenSymbol;
  chain: ChainType;
}

export interface AgentStats {
  totalCalls?: number;
  successRate?: number;
  avgResponseTime?: number;
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

// Payment Types
export interface PaymentStatus {
  userId: string;
  availableBudget: string;
  reservedBudget: string;
  totalSpent: string;
  token: TokenSymbol;
  chain: ChainType;
}

export interface BudgetInfo extends PaymentStatus {
  userWallet: string;
  reservations: BudgetReservation[];
}

export interface BudgetReservation {
  runId: string;
  amount: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Workflow Execution Request
export interface ExecuteWorkflowRequest {
  yaml?: string;
  workflow?: WorkflowDefinition;
  userId: string;
  userWallet: string;
  inputs: Record<string, any>;
  maxBudget?: string;
  chain?: ChainType;
  token?: TokenSymbol;
}

// Agent Creation Request
export interface CreateAgentRequest {
  ref: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ownerWallet: string;
  endpointType: 'http' | 'native';
  endpointUrl: string;
  pricing: AgentPricing;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  tags?: string[];
  supportedChains?: ChainType[];
  supportedTokens?: TokenSymbol[];
}
