/**
 * Dialogue Execution Service
 * Handles natural conversation-style agent interactions
 */

import type { DialogueConfig, DialogueTurn, WorkflowNode } from '../types/workflow.types';
import type { NodeRun } from '../types/execution.types';
import { A2AAgentCaller } from './a2a-agent-caller.service';
import { AgentRegistry } from '../registry';
import { TemplateResolver } from '../utils/template-resolver';
import { createLogger } from '../utils';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('DialogueExecutor');

export interface DialogueContext {
  turns: DialogueTurnResult[];
  participants: Map<string, any>; // Speaker -> agent info
  conversationHistory: string[];
}

export interface DialogueTurnResult {
  turnId: string;
  speaker: string;
  prompt: string;
  response: string;
  timestamp: Date;
  cost: string;
}

export class DialogueExecutor {
  private templateResolver = new TemplateResolver();

  constructor(
    private agentRegistry: AgentRegistry,
    private agentCaller: A2AAgentCaller
  ) {}

  /**
   * Execute a dialogue-style interaction
   */
  async executeDialogue(
    dialogueNode: WorkflowNode,
    workflowContext: Record<string, any>,
    runId: string
  ): Promise<NodeRun> {
    logger.info(`Starting dialogue: ${dialogueNode.name}`);

    const dialogue = dialogueNode.dialogue;
    if (!dialogue) {
      throw new Error('No dialogue configuration found');
    }

    const dialogueContext: DialogueContext = {
      turns: [],
      participants: new Map(),
      conversationHistory: [],
    };

    // Initialize participants
    for (const participantRef of dialogue.participants) {
      const agent = await this.agentRegistry.getAgent(participantRef);
      if (agent) {
        dialogueContext.participants.set(participantRef, agent);
      }
    }

    let turnCount = 0;
    const maxTurns = dialogue.maxTurns || dialogue.turns.length;

    // Execute dialogue based on mode
    switch (dialogue.mode) {
      case 'sequential':
        await this.executeSequentialDialogue(dialogue, dialogueContext, workflowContext, runId, maxTurns);
        break;
      case 'round-robin':
        await this.executeRoundRobinDialogue(dialogue, dialogueContext, workflowContext, runId, maxTurns);
        break;
      case 'dynamic':
        await this.executeDynamicDialogue(dialogue, dialogueContext, workflowContext, runId, maxTurns);
        break;
    }

    // Create node run result
    const nodeRun: NodeRun = {
      nodeRunId: uuidv4(),
      runId,
      nodeId: dialogueNode.id,
      agentRef: dialogueNode.agentRef || 'dialogue',
      status: 'completed',
      startedAt: new Date(),
      endedAt: new Date(),
      inputs: workflowContext,
      output: {
        turns: dialogueContext.turns,
        conversationHistory: dialogueContext.conversationHistory,
        summary: this.generateDialogueSummary(dialogueContext),
      },
      cost: dialogueContext.turns.reduce((sum, turn) => {
        return (parseFloat(sum) + parseFloat(turn.cost)).toString();
      }, '0'),
      retryCount: 0,
      logs: [`Completed ${dialogueContext.turns.length} dialogue turns`],
    };

    return nodeRun;
  }

  /**
   * Execute dialogue with pre-defined sequential turns
   */
  private async executeSequentialDialogue(
    dialogue: DialogueConfig,
    context: DialogueContext,
    workflowContext: Record<string, any>,
    runId: string,
    maxTurns: number
  ): Promise<void> {
    logger.info('Executing sequential dialogue');

    for (let i = 0; i < Math.min(dialogue.turns.length, maxTurns); i++) {
      const turn = dialogue.turns[i];
      if (!turn) continue;
      
      // Check end condition
      if (dialogue.endCondition && this.shouldEndDialogue(dialogue.endCondition, context, workflowContext)) {
        logger.info('Dialogue end condition met');
        break;
      }

      await this.executeTurn(turn, context, workflowContext, runId);
    }
  }

  /**
   * Execute round-robin dialogue where participants take turns
   */
  private async executeRoundRobinDialogue(
    dialogue: DialogueConfig,
    context: DialogueContext,
    workflowContext: Record<string, any>,
    runId: string,
    maxTurns: number
  ): Promise<void> {
    logger.info('Executing round-robin dialogue');

    let currentIndex = 0;
    const participants = dialogue.participants;

    for (let i = 0; i < maxTurns; i++) {
      // Check end condition
      if (dialogue.endCondition && this.shouldEndDialogue(dialogue.endCondition, context, workflowContext)) {
        logger.info('Dialogue end condition met');
        break;
      }

      const speaker = participants[currentIndex % participants.length];
      
      if (!speaker) {
        logger.warn('No speaker found at index, skipping turn');
        currentIndex++;
        continue;
      }
      
      // Create dynamic turn
      const turn: DialogueTurn = {
        speaker,
        prompt: this.generateDynamicPrompt(speaker, context, workflowContext),
        respondTo: context.turns.slice(-3).map(t => t.turnId), // Respond to last 3 turns
      };

      await this.executeTurn(turn, context, workflowContext, runId);
      currentIndex++;
    }
  }

  /**
   * Execute dynamic dialogue where agents decide when to speak
   */
  private async executeDynamicDialogue(
    dialogue: DialogueConfig,
    context: DialogueContext,
    workflowContext: Record<string, any>,
    runId: string,
    maxTurns: number
  ): Promise<void> {
    logger.info('Executing dynamic dialogue');

    for (let i = 0; i < maxTurns; i++) {
      // Check end condition
      if (dialogue.endCondition && this.shouldEndDialogue(dialogue.endCondition, context, workflowContext)) {
        logger.info('Dialogue end condition met');
        break;
      }

      // In dynamic mode, we need to determine which agent should speak next
      // This could be based on:
      // - Content analysis
      // - Turn history
      // - Agent roles
      const nextSpeaker = this.selectNextSpeaker(dialogue.participants, context, workflowContext);
      
      if (!nextSpeaker) {
        logger.warn('No next speaker selected, ending dialogue');
        break;
      }

      const turn: DialogueTurn = {
        speaker: nextSpeaker,
        prompt: this.generateDynamicPrompt(nextSpeaker, context, workflowContext),
        respondTo: context.turns.slice(-2).map(t => t.turnId),
      };

      await this.executeTurn(turn, context, workflowContext, runId);
    }
  }

  /**
   * Execute a single dialogue turn
   */
  private async executeTurn(
    turn: DialogueTurn,
    context: DialogueContext,
    workflowContext: Record<string, any>,
    runId: string
  ): Promise<void> {
    logger.info(`Turn: ${turn.speaker} speaking`);

    const turnId = uuidv4();
    
    // Get agent
    const agent = context.participants.get(turn.speaker);
    if (!agent) {
      logger.warn(`Agent ${turn.speaker} not found in participants`);
      return;
    }

    // Build context with conversation history
    const turnContext = {
      ...workflowContext,
      conversationHistory: context.conversationHistory,
      previousTurns: context.turns,
    };

    // Resolve prompt template
    const resolvedPrompt = this.templateResolver.resolve(turn.prompt, turnContext);

    // Execute agent call
    try {
      // Get the agent's endpoint URL (card URL)
      const cardUrl = agent.endpointUrl;
      if (!cardUrl) {
        throw new Error(`Agent ${agent.ref} has no endpoint URL configured`);
      }
      
      // Call agent with resolved prompt (just the string, not an object)
      const result = await this.agentCaller.callAgent(cardUrl, resolvedPrompt);

      // Extract response from result
      let response = '';
      
      // Handle A2A Message format
      if ('kind' in result && result.kind === 'message' && 'parts' in result) {
        const message = result as any;
        // Extract text from message parts
        for (const part of message.parts) {
          if (part.kind === 'text') {
            response += part.text;
          } else if (part.kind === 'data' && part.data?.response) {
            response += part.data.response;
          }
        }
      } else if ('output' in result && result.output) {
        const output = result.output as any;
        response = output.response || output.text || JSON.stringify(output);
      } else if ('text' in result) {
        response = (result as any).text;
      } else {
        response = JSON.stringify(result);
      }
      
      // Record turn result
      const turnResult: DialogueTurnResult = {
        turnId,
        speaker: turn.speaker,
        prompt: resolvedPrompt,
        response,
        timestamp: new Date(),
        cost: ('cost' in result ? (result as any).cost : '0') || '0',
      };

      context.turns.push(turnResult);
      
      // Update conversation history in natural format
      context.conversationHistory.push(
        `${this.getSpeakerName(turn.speaker)}: ${turnResult.response}`
      );

      logger.info(`Turn completed. Response length: ${turnResult.response.length}`);
    } catch (error) {
      logger.error(`Error executing turn for ${turn.speaker}:`, error);
      throw error;
    }
  }

  /**
   * Generate dynamic prompt based on conversation state
   */
  private generateDynamicPrompt(
    speaker: string,
    context: DialogueContext,
    workflowContext: Record<string, any>
  ): string {
    const recentHistory = context.conversationHistory.slice(-3).join('\n');
    
    // Build a prompt that includes the actual topic from inputs
    const topic = Object.values(workflowContext.inputs || workflowContext || {}).join(', ') || 'the current topic';
    return `Based on the conversation so far:\n${recentHistory}\n\nPlease provide your perspective on: ${topic}`;
  }

  /**
   * Select next speaker in dynamic dialogue
   */
  private selectNextSpeaker(
    participants: string[],
    context: DialogueContext,
    workflowContext: Record<string, any>
  ): string {
    // Simple strategy: rotate through participants who haven't spoken recently
    const recentSpeakers = context.turns.slice(-2).map(t => t.speaker);
    
    for (const participant of participants) {
      if (!recentSpeakers.includes(participant)) {
        return participant;
      }
    }
    
    // If everyone spoke recently, just pick the first one
    return participants[0] || '';
  }

  /**
   * Check if dialogue should end
   */
  private shouldEndDialogue(
    endCondition: string,
    context: DialogueContext,
    workflowContext: Record<string, any>
  ): boolean {
    // Simple condition evaluation
    // Could be enhanced with proper expression parser
    const conditionContext = {
      ...workflowContext,
      turnCount: context.turns.length,
      lastResponse: context.turns[context.turns.length - 1]?.response || '',
    };

    try {
      // Very basic condition evaluation
      // In production, use a proper expression parser
      return this.templateResolver.resolve(endCondition, conditionContext) === 'true';
    } catch (error) {
      logger.warn('Error evaluating end condition:', error);
      return false;
    }
  }

  /**
   * Generate summary of dialogue
   */
  private generateDialogueSummary(context: DialogueContext): any {
    return {
      totalTurns: context.turns.length,
      participants: Array.from(context.participants.keys()),
      startTime: context.turns[0]?.timestamp,
      endTime: context.turns[context.turns.length - 1]?.timestamp,
      conversationHistory: context.conversationHistory,
    };
  }

  /**
   * Get friendly speaker name
   */
  private getSpeakerName(speakerRef: string): string {
    // Extract readable name from agent ref
    // e.g., 'ceo-agent-v1' -> 'CEO'
    const parts = speakerRef.split('-');
    return parts.length > 0 ? (parts[0] || 'UNKNOWN').toUpperCase() : 'UNKNOWN';
  }

  /**
   * Format dialogue for output
   */
  formatDialogue(turns: DialogueTurnResult[]): string {
    return turns
      .map(turn => {
        const speaker = this.getSpeakerName(turn.speaker);
        return `${speaker}: ${turn.response}`;
      })
      .join('\n\n');
  }
}
