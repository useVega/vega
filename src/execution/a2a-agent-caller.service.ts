/**
 * A2A Agent Caller Service
 * Handles communication with A2A-compliant agents
 */

import { A2AClient } from '@a2a-js/sdk/client';
import type { Message, MessageSendParams } from '@a2a-js/sdk';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils';
import type { A2AClientConfig, A2AExecutionResult, A2AStreamEvent } from '../types/a2a.types';
import { ExecutionError } from '../types/errors.types';

const logger = createLogger('A2ACaller');

export class A2AAgentCaller {
  private clients: Map<string, A2AClient> = new Map();

  /**
   * Get or create A2A client for an agent
   */
  private async getClient(cardUrl: string, config?: Partial<A2AClientConfig>): Promise<A2AClient> {
    const cacheKey = cardUrl;
    
    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    try {
      logger.info(`Creating A2A client for: ${cardUrl}`);
      
      const clientOptions: any = {};
      if (config?.fetchImpl) {
        clientOptions.fetchImpl = config.fetchImpl;
      }

      const client = await A2AClient.fromCardUrl(cardUrl, clientOptions);
      this.clients.set(cacheKey, client);
      
      logger.info(`✓ A2A client created successfully for: ${cardUrl}`);
      return client;
    } catch (error) {
      logger.error(`Failed to create A2A client for ${cardUrl}:`, error);
      throw new ExecutionError(
        `Failed to create A2A client for ${cardUrl}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Call an A2A agent with a message
   */
  async callAgent(
    cardUrl: string,
    inputMessage: string,
    contextId?: string,
    config?: Partial<A2AClientConfig>
  ): Promise<A2AExecutionResult> {
    // Ensure inputMessage is a string
    const messageText = typeof inputMessage === 'string' ? inputMessage : JSON.stringify(inputMessage);
    
    // Check if this is a simple HTTP endpoint (localhost agents)
    if (cardUrl.includes('localhost')) {
      return this.callSimpleHttpAgent(cardUrl, messageText, contextId);
    }

    const client = await this.getClient(cardUrl, config);

    const message: Message = {
      messageId: uuidv4(),
      role: 'user',
      parts: [{ kind: 'text', text: messageText }],
      kind: 'message',
      contextId,
    };

    const sendParams: MessageSendParams = {
      message,
      configuration: {
        blocking: true,
      },
    };

    try {
      logger.info(`Calling agent at: ${cardUrl}`);
      const response = await client.sendMessage(sendParams);

      if ('error' in response) {
        logger.error(`Agent returned error:`, response.error);
        throw new ExecutionError(
          `Agent call failed: ${response.error.message}`,
          response.error
        );
      }

      logger.info(`Agent call successful, result kind: ${response.result.kind}`);
      return response.result;
    } catch (error) {
      logger.error(`Failed to call agent:`, error);
      throw new ExecutionError(
        `Failed to call agent at ${cardUrl}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Call an A2A agent with structured inputs
   */
  async callAgentWithInputs(
    cardUrl: string,
    inputs: Record<string, any>,
    contextId?: string,
    config?: Partial<A2AClientConfig>
  ): Promise<A2AExecutionResult> {
    // Convert inputs to a formatted message
    const inputText = Object.entries(inputs)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return this.callAgent(cardUrl, inputText, contextId, config);
  }

  /**
   * Stream responses from an A2A agent
   */
  async *streamAgent(
    cardUrl: string,
    inputMessage: string,
    contextId?: string,
    config?: Partial<A2AClientConfig>
  ): AsyncGenerator<A2AStreamEvent> {
    const client = await this.getClient(cardUrl, config);

    const message: Message = {
      messageId: uuidv4(),
      role: 'user',
      parts: [{ kind: 'text', text: inputMessage }],
      kind: 'message',
      contextId,
    };

    const sendParams: MessageSendParams = {
      message,
      configuration: {
        blocking: false, // Non-blocking for streaming
      },
    };

    try {
      logger.info(`Starting stream from agent: ${cardUrl}`);
      const stream = client.sendMessageStream(sendParams);

      for await (const event of stream) {
        logger.debug(`Received stream event: ${event.kind}`);
        yield event as A2AStreamEvent;
      }

      logger.info(`Stream completed from agent: ${cardUrl}`);
    } catch (error) {
      throw new ExecutionError(
        `Failed to stream from agent at ${cardUrl}`,
        error
      );
    }
  }

  /**
   * Check if an agent is available
   */
  async checkAgentAvailability(cardUrl: string): Promise<boolean> {
    try {
      await this.getClient(cardUrl);
      return true;
    } catch (error) {
      logger.warn(`Agent at ${cardUrl} is not available:`, error);
      return false;
    }
  }

  /**
   * Call a simple HTTP agent (for local development)
   */
  private async callSimpleHttpAgent(
    baseUrl: string,
    inputMessage: string,
    contextId?: string
  ): Promise<A2AExecutionResult> {
    try {
      logger.info(`Calling simple HTTP agent at: ${baseUrl}/messages`);
      
      // Create A2A-style message
      const message: Message = {
        messageId: uuidv4(),
        role: 'user',
        parts: [{ kind: 'text', text: inputMessage }],
        kind: 'message',
        contextId,
      };

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info(`✓ Simple HTTP agent responded successfully`);
      return result as Message;
    } catch (error) {
      logger.error(`Failed to call simple HTTP agent:`, error);
      throw new ExecutionError(
        `Failed to call simple HTTP agent at ${baseUrl}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Get agent card information
   */
  async getAgentCard(cardUrl: string): Promise<any> {
    const client = await this.getClient(cardUrl);
    return (client as any).agentCard; // Access the loaded agent card
  }

  /**
   * Clear client cache
   */
  clearCache(): void {
    this.clients.clear();
    logger.info('A2A client cache cleared');
  }
}
