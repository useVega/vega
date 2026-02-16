/**
 * Frontend Abstraction Demo
 * Demonstrates how to use the frontend client APIs
 */

import { AgenticClient } from './src/frontend';

async function main() {
  console.log('='.repeat(70));
  console.log('🎨 Frontend Abstraction Demo');
  console.log('='.repeat(70));

  // Initialize the client
  const client = new AgenticClient({
    apiUrl: 'http://localhost:3000',
    defaultChain: 'base',
    defaultToken: 'USDC',
    timeout: 30000,
  });

  console.log('\n✓ Client initialized');

  // ==========================================================================
  // 1. AGENT MANAGEMENT
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('1. Agent Management');
  console.log('='.repeat(70));

  // Create an agent
  const createResult = await client.agents.create({
    ref: 'demo-agent-v1',
    name: 'Demo Text Processor',
    description: 'A simple text processing agent for demonstration',
    category: 'data-processing',
    version: '1.0.0',
    ownerWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    endpointType: 'http',
    endpointUrl: 'http://localhost:8080/process',
    pricing: {
      type: 'per-call',
      amount: '0.05',
      token: 'USDC',
      chain: 'base',
    },
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      required: ['text'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'string' },
      },
    },
    tags: ['demo', 'text', 'processing'],
  });

  if (createResult.success) {
    console.log('\n✓ Agent created:', createResult.agent?.ref);
    
    // Publish the agent
    await client.agents.publish(createResult.agent!.ref);
    console.log('✓ Agent published');
  } else {
    console.error('✗ Failed to create agent:', createResult.error);
  }

  // Search for agents
  const searchResult = await client.agents.search({
    category: 'data-processing',
    status: 'active',
    maxPrice: '0.10',
  });

  console.log(`\n✓ Found ${searchResult.total} agents`);
  searchResult.agents.forEach(agent => {
    console.log(`  - ${agent.name} (${agent.ref}): ${agent.pricing.amount} ${agent.pricing.token}`);
  });

  // ==========================================================================
  // 2. WORKFLOW PARSING
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('2. Workflow Parsing');
  console.log('='.repeat(70));

  const workflowYaml = `
name: Demo Text Flow
description: Simple text processing workflow
version: 1.0.0
chain: base
token: USDC
maxBudget: "0.50"
entryNode: process

nodes:
  process:
    type: agent
    agent: demo-agent-v1
    name: "Process Text"
    inputs:
      text: "{{input.text}}"

edges: []

tags:
  - demo
  - simple
`;

  const parseResult = await client.workflows.parse(workflowYaml, 'user_demo');

  if (parseResult.valid) {
    console.log('\n✓ Workflow parsed successfully');
    console.log(`  Name: ${parseResult.workflow?.name}`);
    console.log(`  Nodes: ${parseResult.workflow?.nodes}`);
    console.log(`  Estimated Cost: ${parseResult.workflow?.estimatedCost} USDC`);
  } else {
    console.error('\n✗ Workflow parsing failed:');
    parseResult.errors?.forEach(err => {
      console.error(`  - ${err.message}`);
    });
  }

  // ==========================================================================
  // 3. BUDGET MANAGEMENT
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('3. Budget Management');
  console.log('='.repeat(70));

  // Add funds
  const addFundsResult = await client.payments.addFunds(
    'user_demo',
    '10.0',
    'USDC'
  );

  if (addFundsResult.success) {
    console.log('\n✓ Funds added');
    console.log(`  New balance: ${addFundsResult.newBalance} USDC`);
  }

  // Check status
  const paymentStatus = await client.payments.getStatus('user_demo', 'USDC', 'base');

  if (paymentStatus) {
    console.log('\n✓ Payment Status:');
    console.log(`  Available: ${paymentStatus.availableBudget} ${paymentStatus.token}`);
    console.log(`  Reserved: ${paymentStatus.reservedBudget} ${paymentStatus.token}`);
    console.log(`  Spent: ${paymentStatus.totalSpent} ${paymentStatus.token}`);
  }

  // ==========================================================================
  // 4. WORKFLOW EXECUTION
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('4. Workflow Execution');
  console.log('='.repeat(70));

  const executeResult = await client.workflows.execute({
    yaml: workflowYaml,
    userId: 'user_demo',
    userWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    inputs: {
      text: 'Hello from the frontend abstraction!',
    },
  });

  if (executeResult.success) {
    console.log('\n✓ Workflow execution started');
    console.log(`  Run ID: ${executeResult.runId}`);

    // Poll for progress
    const runId = executeResult.runId!;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 10;

    console.log('\n📊 Monitoring execution...');

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const progress = await client.workflows.getProgress(runId);
      if (progress) {
        console.log(`  Status: ${progress.status} | Completed: ${progress.completedNodes.length}/${progress.totalNodes}`);

        if (progress.status === 'completed' || progress.status === 'failed') {
          completed = true;

          // Get final result
          const result = await client.workflows.getResult(runId);
          if (result) {
            console.log('\n✓ Execution completed!');
            console.log(`  Status: ${result.status}`);
            console.log(`  Duration: ${result.executionTime}ms`);
            console.log(`  Total Cost: ${result.totalCost} USDC`);
            console.log('\n  Outputs:');
            console.log(JSON.stringify(result.outputs, null, 2));
          }
        }
      }

      attempts++;
    }

    if (!completed) {
      console.log('\n⏱️  Execution still running (timeout reached)');
    }
  } else {
    console.error('\n✗ Failed to execute workflow:', executeResult.error);
  }

  // ==========================================================================
  // 5. WORKFLOW TEMPLATES
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('5. Workflow Templates');
  console.log('='.repeat(70));

  const template = client.workflows.generateTemplate();
  console.log('\nGenerated workflow template:');
  console.log(template);

  // ==========================================================================
  // 6. HEALTH CHECK
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('6. System Health');
  console.log('='.repeat(70));

  const health = await client.healthCheck();
  console.log('\n✓ System Status:', health.status);
  console.log('  Services:');
  console.log(`    Registry: ${health.services.registry ? '✓' : '✗'}`);
  console.log(`    Execution: ${health.services.execution ? '✓' : '✗'}`);
  console.log(`    Payment: ${health.services.payment ? '✓' : '✗'}`);

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('✨ Demo completed successfully!');
  console.log('='.repeat(70));
  console.log('\nThe frontend abstraction provides:');
  console.log('  ✓ Unified client interface');
  console.log('  ✓ Simplified agent management');
  console.log('  ✓ Easy workflow parsing and execution');
  console.log('  ✓ Budget and payment handling');
  console.log('  ✓ Progress monitoring');
  console.log('  ✓ Template generation');
  console.log('\nReady for frontend integration! 🚀');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
