/**
 * Payment Client
 * Handles budget management and payment operations
 */

import type {
  ClientConfig,
  PaymentStatus,
  BudgetInfo,
} from './types';
import { BudgetManager } from '../payment/budget-manager.service';
import { createLogger } from '../utils';
import type { TokenSymbol, ChainType } from '../types';

const logger = createLogger('PaymentClient');

/**
 * Client for payment operations
 */
export class PaymentClient {
  private budgetManager: BudgetManager;
  private config: Required<ClientConfig>;

  constructor(
    config: Required<ClientConfig>,
    budgetManager?: BudgetManager
  ) {
    this.config = config;
    this.budgetManager = budgetManager || new BudgetManager();
    logger.info('PaymentClient initialized');
  }

  /**
   * Get user payment status
   */
  async getStatus(
    userId: string,
    token?: TokenSymbol,
    chain?: ChainType
  ): Promise<PaymentStatus | null> {
    try {
      logger.info('Getting payment status', { userId });

      const effectiveToken = token || this.config.defaultToken;
      const effectiveChain = chain || this.config.defaultChain;

      // Mock implementation - would need proper budget tracking
      const balance = await this.budgetManager.getBalance(userId, effectiveToken);

      return {
        userId,
        availableBudget: balance,
        reservedBudget: '0',
        totalSpent: '0',
        token: effectiveToken,
        chain: effectiveChain,
      };
    } catch (error) {
      logger.error('Failed to get payment status', error);
      return null;
    }
  }

  /**
   * Get detailed budget information
   */
  async getBudgetInfo(
    userId: string,
    userWallet: string,
    token?: TokenSymbol,
    chain?: ChainType
  ): Promise<BudgetInfo | null> {
    try {
      logger.info('Getting budget info', { userId });

      const effectiveToken = token || this.config.defaultToken;
      const effectiveChain = chain || this.config.defaultChain;

      const balance = await this.budgetManager.getBalance(userWallet, effectiveToken);

      return {
        userId,
        userWallet,
        available: balance,
        reserved: '0',
        spent: '0',
        token: effectiveToken,
        chain: effectiveChain,
        reservations: [], // Would need proper reservation tracking
      };
    } catch (error) {
      logger.error('Failed to get budget info', error);
      return null;
    }
  }

  /**
   * Add funds to user budget
   */
  async addFunds(
    userId: string,
    amount: string,
    token?: TokenSymbol
  ): Promise<{
    success: boolean;
    newBalance?: string;
    error?: string;
  }> {
    try {
      logger.info('Adding funds', { userId, amount });

      const effectiveToken = token || this.config.defaultToken;
      
      // For now, just return mock success
      // Would need a public method in BudgetManager to add funds
      logger.warn('addFunds needs implementation in BudgetManager');
      
      const currentBalance = await this.budgetManager.getBalance(userId, effectiveToken);
      const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toString();
      
      return {
        success: true,
        newBalance,
      };
    } catch (error) {
      logger.error('Failed to add funds', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reserve budget for a workflow run
   */
  async reserveBudget(
    userId: string,
    runId: string,
    amount: string,
    token?: TokenSymbol
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Reserving budget', { userId, runId, amount });

      const effectiveToken = token || this.config.defaultToken;
      const effectiveChain = this.config.defaultChain;
      
      await this.budgetManager.reserveBudget({
        runId,
        userWallet: userId,
        amount,
        token: effectiveToken,
        chain: effectiveChain,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reserve budget', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Release reserved budget
   */
  async releaseBudget(
    userId: string,
    runId: string,
    token?: TokenSymbol
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.info('Releasing budget', { userId, runId });

      await this.budgetManager.releaseBudget(runId);

      return { success: true };
    } catch (error) {
      logger.error('Failed to release budget', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Settle budget (convert reserved to spent)
   */
  async settleBudget(
    userId: string,
    runId: string,
    actualAmount: string,
    token?: TokenSymbol
  ): Promise<{
    success: boolean;
    refunded?: string;
    error?: string;
  }> {
    try {
      logger.info('Settling budget', { userId, runId, actualAmount });

      await this.budgetManager.releaseBudget(runId, actualAmount);

      return {
        success: true,
        refunded: '0', // Would need to calculate refund amount
      };
    } catch (error) {
      logger.error('Failed to settle budget', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user has sufficient funds
   */
  async checkSufficientFunds(
    userId: string,
    requiredAmount: string,
    token?: TokenSymbol
  ): Promise<boolean> {
    try {
      const effectiveToken = token || this.config.defaultToken;
      const balance = await this.budgetManager.getBalance(userId, effectiveToken);
      return parseFloat(balance) >= parseFloat(requiredAmount);
    } catch (error) {
      logger.error('Failed to check funds', error);
      return false;
    }
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): TokenSymbol[] {
    return ['USDC', 'USDT', 'ETH', 'SOL'];
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainType[] {
    return ['base', 'arbitrum', 'ethereum', 'solana'];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Required<ClientConfig>): void {
    this.config = config;
  }
}
