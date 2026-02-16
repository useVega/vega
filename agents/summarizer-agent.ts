import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type { AgentCard, Message } from '@a2a-js/sdk';

dotenv.config();

const app = express();
const PORT = process.env.SUMMARIZER_AGENT_PORT || 3013;
const BASE_URL = `http://localhost:${PORT}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

const SUMMARIZER_SYSTEM_PROMPT = `You are an executive assistant that creates comprehensive summaries of business discussions. Your role is to:
- Synthesize key points from multiple perspectives
- Identify agreements and disagreements
- Highlight action items and decisions
- Extract strategic recommendations
- Present information in a clear, structured format
- Note any concerns or risks raised

You create concise yet comprehensive summaries that capture the essence of complex discussions.`;

const AGENT_CARD: AgentCard = {
  agentId: 'summarizer-agent-v1',
  name: 'Summarizer Agent',
  description: 'Executive Assistant providing discussion summaries',
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
      discussion: { type: 'array', items: { type: 'string' } },
      topic: { type: 'string' },
      prompt: { type: 'string' },
    },
    required: [],
  },
  outputSchema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
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
    let discussion: string[] = [];
    let topic = '';

    for (const part of message.parts) {
      if (part.kind === 'text') {
        userPrompt += part.text + '\n';
      } else if (part.kind === 'data') {
        const data = part.data as any;
        if (data.discussion) discussion = data.discussion;
        if (data.topic) topic = data.topic;
        if (data.prompt) userPrompt = data.prompt;
      }
    }

    console.log('[Summarizer Agent] Processing A2A message');

    const discussionText = discussion.length > 0
      ? discussion.map((point, index) => `${index + 1}. ${point}`).join('\n')
      : '';

    const messages = [
      { role: 'system' as const, content: SUMMARIZER_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: userPrompt || `Summarize the following executive discussion about "${topic}":\n\n${discussionText}\n\nProvide a concise executive summary with key insights, agreements, and next steps.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.5,
      max_tokens: 800,
    });

    const summary = completion.choices[0]?.message?.content || 'No summary generated';

    const responseMessage: Message = {
      messageId: `msg-${Date.now()}`,
      role: 'agent',
      kind: 'message',
      parts: [
        { kind: 'text', text: summary },
        { kind: 'data', data: { summary } },
      ],
      contextId: message.contextId,
    };

    res.json(responseMessage);
  } catch (error: any) {
    console.error('[Summarizer Agent] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/execute', async (req, res) => {
  try {
    const { discussion, productIdea } = req.body;

    if (!discussion || !Array.isArray(discussion)) {
      return res.status(400).json({
        success: false,
        error: 'Discussion array is required',
      });
    }

    console.log('[Summarizer Agent] Creating discussion summary...');

    const discussionText = discussion
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n\n');

    const messages = [
      { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Product Idea: ${productIdea || 'Not specified'}\n\nDiscussion:\n${discussionText}\n\nPlease provide a comprehensive executive summary of this discussion, including:\n1. Overview\n2. Key Insights from Each Perspective\n3. Agreements & Synergies\n4. Concerns & Risks\n5. Recommendations\n6. Next Steps`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.5,
      max_tokens: 800,
    });

    const summary = completion.choices[0].message.content;

    res.json({
      success: true,
      summary: summary,
      discussionLength: discussion.length,
      timestamp: new Date().toISOString(),
      metadata: {
        productIdea: productIdea,
        rounds: Math.ceil(discussion.length / 3),
      },
    });

  } catch (error) {
    console.error('[Summarizer Agent] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/chat-summary', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }

    console.log('[Summarizer Agent] Summarizing chat messages...');

    const chatText = messages
      .map((msg) => `${msg.speaker} (${msg.role}): ${msg.message}`)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Summarize this conversation:\n\n${chatText}`,
        },
      ] as any,
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = completion.choices[0].message.content;

    res.json({
      success: true,
      summary: summary,
      messageCount: messages.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Summarizer Agent] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agent: 'Summarizer', 
    role: 'Executive Assistant',
    features: ['discussion-summary', 'chat-summary']
  });
});

app.listen(PORT, () => {
  console.log(`📝 Summarizer Agent running on port ${PORT}`);
  console.log(`   Role: Executive Assistant`);
  console.log(`   Focus: Discussion Synthesis & Summaries`);
});
