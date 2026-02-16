import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type { AgentCard, Message } from '@a2a-js/sdk';

dotenv.config();

const app = express();
const PORT = process.env.CEO_AGENT_PORT || 3010;
const BASE_URL = `http://localhost:${PORT}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

const CEO_SYSTEM_PROMPT = `You are a strategic CEO with extensive experience in scaling businesses. Your perspective focuses on:
- Market opportunity and business viability
- Revenue models and unit economics
- Competitive positioning and differentiation
- Strategic partnerships and go-to-market strategy
- Growth potential and scalability
- Risk assessment and mitigation
- Long-term vision and sustainability

You provide insightful, data-driven strategic analysis while being pragmatic about execution. You balance ambition with feasibility.`;

// A2A Agent Card - defines agent capabilities and interface
const AGENT_CARD: AgentCard = {
  agentId: 'ceo-agent-v1',
  name: 'CEO Agent',
  description: 'Strategic Business Leader providing executive-level business analysis',
  url: BASE_URL,
  version: '1.0.0',
  capabilities: {
    streaming: false,
  },
  interface: {
    url: `${BASE_URL}/messages`,
  },
  inputSchema: {
    type: 'object',
    properties: {
      productIdea: {
        type: 'string',
        description: 'The product idea to analyze',
      },
      previousDiscussion: {
        type: 'array',
        description: 'Previous discussion context',
        items: { type: 'string' },
      },
      prompt: {
        type: 'string',
        description: 'Direct prompt for the CEO agent',
      },
    },
    required: [],
  },
  outputSchema: {
    type: 'object',
    properties: {
      response: {
        type: 'string',
        description: 'Strategic analysis response',
      },
    },
  },
} as AgentCard;

// A2A Protocol: GET / - Return agent card
app.get('/', (req, res) => {
  res.json(AGENT_CARD);
});

// A2A Protocol: POST /messages - Handle A2A messages
app.post('/messages', async (req, res) => {
  try {
    const message: Message = req.body;

    if (message.kind !== 'message') {
      return res.status(400).json({
        error: 'Invalid message kind',
      });
    }

    // Extract text from message parts
    let userPrompt = '';
    let productIdea = '';
    let previousDiscussion: string[] = [];

    for (const part of message.parts) {
      if (part.kind === 'text') {
        userPrompt += part.text + '\n';
      } else if (part.kind === 'data') {
        const data = part.data as any;
        if (data.productIdea) productIdea = data.productIdea;
        if (data.previousDiscussion) previousDiscussion = data.previousDiscussion;
        if (data.prompt) userPrompt = data.prompt;
      }
    }

    console.log('[CEO Agent] Processing A2A message:', { userPrompt: userPrompt.substring(0, 100) });

    const context = previousDiscussion.length > 0
      ? `\n\nPrevious discussion points:\n${previousDiscussion.join('\n')}`
      : '';

    const messages = [
      { role: 'system' as const, content: CEO_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: userPrompt || `Analyze this product idea from a CEO's strategic perspective: ${productIdea}${context}\n\nProvide your strategic analysis in 3-4 concise paragraphs.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';

    // Return A2A message response
    const responseMessage: Message = {
      messageId: `msg-${Date.now()}`,
      role: 'agent',
      kind: 'message',
      parts: [
        {
          kind: 'text',
          text: response,
        },
        {
          kind: 'data',
          data: { response },
        },
      ],
      contextId: message.contextId,
    };

    res.json(responseMessage);
  } catch (error: any) {
    console.error('[CEO Agent] Error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// Legacy endpoint for backward compatibility
app.post('/execute', async (req, res) => {
  try {
    const { productIdea, previousDiscussion = [] } = req.body;

    if (!productIdea) {
      return res.status(400).json({
        success: false,
        error: 'Product idea is required',
      });
    }

    console.log('[CEO Agent] Analyzing product:', productIdea);

    const context = previousDiscussion.length > 0
      ? `\n\nPrevious discussion points:\n${previousDiscussion.join('\n')}`
      : '';

    const messages = [
      { role: 'system', content: CEO_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this product idea from a CEO's strategic perspective: ${productIdea}${context}\n\nProvide your strategic analysis in 3-4 concise paragraphs.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 400,
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      response: response,
      agent: 'CEO',
      role: 'Strategic Business Leader',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CEO Agent] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agent: 'CEO', 
    role: 'Strategic Business Leader',
    capabilities: ['strategic-analysis', 'market-assessment', 'business-viability']
  });
});

app.listen(PORT, () => {
  console.log(`🎯 CEO Agent running on port ${PORT}`);
  console.log(`   Role: Strategic Business Leader`);
  console.log(`   Focus: Market Strategy & Business Viability`);
});
