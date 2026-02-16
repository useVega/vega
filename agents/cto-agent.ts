import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type { AgentCard, Message } from '@a2a-js/sdk';

dotenv.config();

const app = express();
const PORT = process.env.CTO_AGENT_PORT || 3011;
const BASE_URL = `http://localhost:${PORT}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

const CTO_SYSTEM_PROMPT = `You are an experienced CTO with deep technical expertise across modern technology stacks. Your perspective focuses on:
- Technical architecture and system design
- Technology stack selection and trade-offs
- Scalability and performance considerations
- Security, privacy, and compliance
- Development team structure and skillsets needed
- Infrastructure and DevOps requirements
- Technical risks and mitigation strategies
- Innovation vs. proven technology balance

You provide practical technical guidance while considering business constraints. You think about both immediate MVP needs and long-term architectural evolution.`;

const AGENT_CARD: AgentCard = {
  agentId: 'cto-agent-v1',
  name: 'CTO Agent',
  description: 'Technical Architecture Expert providing technical analysis',
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
      productIdea: { type: 'string' },
      previousDiscussion: { type: 'array', items: { type: 'string' } },
      prompt: { type: 'string' },
    },
    required: [],
  },
  outputSchema: {
    type: 'object',
    properties: {
      response: { type: 'string' },
    },
  },
} as AgentCard;

app.get('/', (req, res) => {
  res.json(AGENT_CARD);
});

app.post('/messages', async (req, res) => {
  try {
    const message: Message = req.body;
    if (message.kind !== 'message') {
      return res.status(400).json({ error: 'Invalid message kind' });
    }

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

    console.log('[CTO Agent] Processing A2A message');

    const context = previousDiscussion.length > 0
      ? `\n\nPrevious discussion points:\n${previousDiscussion.join('\n')}`
      : '';

    const messages = [
      { role: 'system' as const, content: CTO_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: userPrompt || `Analyze this product idea from a CTO's technical perspective: ${productIdea}${context}\n\nProvide your technical analysis in 3-4 concise paragraphs.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';

    const responseMessage: Message = {
      messageId: `msg-${Date.now()}`,
      role: 'agent',
      kind: 'message',
      parts: [
        { kind: 'text', text: response },
        { kind: 'data', data: { response } },
      ],
      contextId: message.contextId,
    };

    res.json(responseMessage);
  } catch (error: any) {
    console.error('[CTO Agent] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/execute', async (req, res) => {
  try {
    const { productIdea, previousDiscussion = [] } = req.body;

    if (!productIdea) {
      return res.status(400).json({
        success: false,
        error: 'Product idea is required',
      });
    }

    console.log('[CTO Agent] Analyzing product:', productIdea);

    const context = previousDiscussion.length > 0
      ? `\n\nPrevious discussion points:\n${previousDiscussion.join('\n')}`
      : '';

    const messages = [
      { role: 'system', content: CTO_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this product idea from a CTO's technical perspective: ${productIdea}${context}\n\nProvide your technical analysis in 3-4 concise paragraphs covering architecture, stack, and technical considerations.`,
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
      agent: 'CTO',
      role: 'Technical Architecture Leader',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CTO Agent] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agent: 'CTO', 
    role: 'Technical Architecture Leader',
    capabilities: ['architecture-design', 'tech-stack', 'scalability']
  });
});

app.listen(PORT, () => {
  console.log(`💻 CTO Agent running on port ${PORT}`);
  console.log(`   Role: Technical Architecture Leader`);
  console.log(`   Focus: System Design & Technology Strategy`);
});
