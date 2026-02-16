#!/usr/bin/env bun

/**
 * YAML Workflow Runner
 * Executes YAML workflows with schedule, tick, and dialogue features
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { WorkflowYAMLParser } from './src/workflow/yaml-parser.service';
import { AgentScheduler, TickManager } from './src/execution/scheduler.service';
import { DialogueExecutor } from './src/execution/dialogue-executor.service';
import { AgentRegistry } from './src/registry/agent-registry.service';
import { A2AAgentCaller } from './src/execution/a2a-agent-caller.service';

const scheduler = new AgentScheduler();
const tickManager = new TickManager();
const parser = new WorkflowYAMLParser();
const agentRegistry = new AgentRegistry();
const agentCaller = new A2AAgentCaller();
const dialogueExecutor = new DialogueExecutor(agentRegistry, agentCaller);

// Get available workflows from the workflows directory
function getAvailableWorkflows() {
  const workflowsDir = join(process.cwd(), 'workflows');
  const files = readdirSync(workflowsDir).filter(f => f.endsWith('.yaml'));
  
  return files.map(file => ({
    name: file.replace('.yaml', '').split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' '),
    file,
    value: file, // Use filename as value for direct lookup
  }));
}

async function registerAgents() {
  console.log(chalk.cyan('\n📋 Registering agents...\n'));

  // Register CEO Agent
  const ceoAgent = await agentRegistry.createAgent({
    ref: 'ceo-agent-v1',
    name: 'CEO Agent',
    description: 'Strategic Business Leader',
    category: 'analysis',
    endpointUrl: 'http://localhost:3010',
    endpointType: 'http',
    version: '1.0.0',
    ownerId: 'system',
    ownerWallet: '0x0000000000000000000000000000000000000000',
    status: 'draft',
    pricing: {
      type: 'per-call',
      amount: '0.01',
      token: 'USDC',
      chain: 'base',
    },
    inputSchema: {
      type: 'object',
      properties: {
        productIdea: { type: 'string' },
        previousDiscussion: { type: 'array' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
      },
    },
    tags: ['executive', 'strategy', 'leadership'],
    createdAt: new Date(),
    updatedAt: new Date(),
    supportedChains: ['base'],
    supportedTokens: ['USDC'],
  });
  await agentRegistry.publishAgent(ceoAgent.ref);
  console.log(chalk.green(`✓ Registered: ${ceoAgent.name} (${ceoAgent.ref})`));

  // Register CTO Agent
  const ctoAgent = await agentRegistry.createAgent({
    ref: 'cto-agent-v1',
    name: 'CTO Agent',
    description: 'Technical Architecture Leader',
    category: 'analysis',
    endpointUrl: 'http://localhost:3011',
    endpointType: 'http',
    version: '1.0.0',
    ownerId: 'system',
    ownerWallet: '0x0000000000000000000000000000000000000000',
    status: 'draft',
    pricing: {
      type: 'per-call',
      amount: '0.01',
      token: 'USDC',
      chain: 'base',
    },
    inputSchema: {
      type: 'object',
      properties: {
        productIdea: { type: 'string' },
        previousDiscussion: { type: 'array' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
      },
    },
    tags: ['technical', 'architecture', 'development'],
    createdAt: new Date(),
    updatedAt: new Date(),
    supportedChains: ['base'],
    supportedTokens: ['USDC'],
  });
  await agentRegistry.publishAgent(ctoAgent.ref);
  console.log(chalk.green(`✓ Registered: ${ctoAgent.name} (${ctoAgent.ref})`));

  // Register CMO Agent
  const cmoAgent = await agentRegistry.createAgent({
    ref: 'cmo-agent-v1',
    name: 'CMO Agent',
    description: 'Marketing & Brand Leader',
    category: 'analysis',
    endpointUrl: 'http://localhost:3012',
    endpointType: 'http',
    version: '1.0.0',
    ownerId: 'system',
    ownerWallet: '0x0000000000000000000000000000000000000000',
    status: 'draft',
    pricing: {
      type: 'per-call',
      amount: '0.01',
      token: 'USDC',
      chain: 'base',
    },
    inputSchema: {
      type: 'object',
      properties: {
        productIdea: { type: 'string' },
        previousDiscussion: { type: 'array' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
      },
    },
    tags: ['marketing', 'branding', 'growth'],
    createdAt: new Date(),
    updatedAt: new Date(),
    supportedChains: ['base'],
    supportedTokens: ['USDC'],
  });
  await agentRegistry.publishAgent(cmoAgent.ref);
  console.log(chalk.green(`✓ Registered: ${cmoAgent.name} (${cmoAgent.ref})`));

  // Register Summarizer Agent
  const summarizerAgent = await agentRegistry.createAgent({
    ref: 'summarizer-agent-v1',
    name: 'Summarizer Agent',
    description: 'Executive Assistant',
    category: 'summarization',
    endpointUrl: 'http://localhost:3013',
    endpointType: 'http',
    version: '1.0.0',
    ownerId: 'system',
    ownerWallet: '0x0000000000000000000000000000000000000000',
    status: 'draft',
    pricing: {
      type: 'per-call',
      amount: '0.01',
      token: 'USDC',
      chain: 'base',
    },
    inputSchema: {
      type: 'object',
      properties: {
        discussion: { type: 'array' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
      },
    },
    tags: ['summary', 'analysis', 'documentation'],
    createdAt: new Date(),
    updatedAt: new Date(),
    supportedChains: ['base'],
    supportedTokens: ['USDC'],
  });
  await agentRegistry.publishAgent(summarizerAgent.ref);
  console.log(chalk.green(`✓ Registered: ${summarizerAgent.name} (${summarizerAgent.ref})`));

  console.log(chalk.green('\n✅ All agents registered!\n'));
}

async function loadWorkflow(workflowFile: string) {
  const spinner = ora('Loading YAML workflow...').start();
  
  try {
    const yamlPath = join(__dirname, 'workflows', workflowFile);
    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const workflow = parser.parse(yamlContent, 'demo-user');
    
    spinner.succeed('Workflow loaded successfully!');
    return workflow;
  } catch (error) {
    spinner.fail('Failed to load workflow');
    throw error;
  }
}

function displayWorkflowInfo(workflow: any) {
  console.log(chalk.cyan('\n📊 Workflow Information:\n'));
  console.log(chalk.white(`Name: ${chalk.bold(workflow.name)}`));
  console.log(chalk.white(`Version: ${workflow.version}`));
  console.log(chalk.white(`Description: ${workflow.description}`));
  console.log(chalk.white(`Chain: ${workflow.chain}`));
  console.log(chalk.white(`Token: ${workflow.token}`));
  console.log(chalk.white(`Max Budget: ${workflow.maxBudget}`));
  
  if (workflow.executionConfig) {
    console.log(chalk.cyan('\n⚙️  Execution Configuration:\n'));
    console.log(chalk.white(`Mode: ${chalk.bold(workflow.executionConfig.mode || 'default')}`));
    
    if (workflow.executionConfig.schedule) {
      console.log(chalk.white(`Schedule:`));
      console.log(chalk.gray(`  Start: ${workflow.executionConfig.schedule.startTime}`));
      console.log(chalk.gray(`  End: ${workflow.executionConfig.schedule.endTime}`));
      console.log(chalk.gray(`  Timezone: ${workflow.executionConfig.schedule.timezone}`));
      console.log(chalk.gray(`  Days: ${workflow.executionConfig.schedule.daysOfWeek?.join(', ')}`));
      
      const isWithinSchedule = scheduler.isWithinSchedule(workflow.executionConfig.schedule);
      console.log(chalk.white(`Currently within schedule: ${isWithinSchedule ? chalk.green('✓ Yes') : chalk.red('✗ No')}`));
    }
    
    if (workflow.executionConfig.tickConfig) {
      console.log(chalk.white(`Ticks:`));
      console.log(chalk.gray(`  Enabled: ${workflow.executionConfig.tickConfig.enabled}`));
      console.log(chalk.gray(`  Interval: ${workflow.executionConfig.tickConfig.intervalMs}ms`));
      console.log(chalk.gray(`  Max per round: ${workflow.executionConfig.tickConfig.maxTicksPerRound}`));
    }
  }
  
  console.log(chalk.cyan(`\n🔗 Workflow Nodes: ${workflow.nodes.length}\n`));
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(chalk.white(`${index + 1}. ${chalk.bold(node.name)} (${node.id})`));
    console.log(chalk.gray(`   Type: ${node.type}`));
    if (node.agentRef) {
      console.log(chalk.gray(`   Agent: ${node.agentRef}`));
    }
    if (node.dialogue) {
      console.log(chalk.gray(`   Dialogue Mode: ${node.dialogue.mode}`));
      console.log(chalk.gray(`   Participants: ${node.dialogue.participants.length}`));
      console.log(chalk.gray(`   Max Turns: ${node.dialogue.maxTurns}`));
    }
  });
}

async function executeSimpleWorkflow(workflow: any, inputs: any) {
  console.log(chalk.cyan('\n🚀 Executing Workflow...\n'));
  
  // Check schedule if configured
  if (workflow.executionConfig?.schedule) {
    const isWithinSchedule = scheduler.isWithinSchedule(workflow.executionConfig.schedule);
    if (!isWithinSchedule) {
      console.log(chalk.yellow('⚠️  Warning: Current time is outside the configured schedule'));
      const waitTime = scheduler.getWaitTimeMs(workflow.executionConfig.schedule);
      console.log(chalk.yellow(`   Wait time: ${Math.round(waitTime / 60000)} minutes`));
      
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway?',
        default: true,
      }]);
      
      if (!proceed) {
        console.log(chalk.red('\n❌ Execution cancelled\n'));
        return;
      }
    }
  }
  
  // Find dialogue node
  const dialogueNode = workflow.nodes.find((n: any) => n.type === 'dialogue');
  
  if (dialogueNode) {
    console.log(chalk.cyan(`\n💬 Starting dialogue: ${dialogueNode.name}\n`));
    console.log(chalk.white('Dialogue configuration:'));
    console.log(chalk.gray(`  Mode: ${dialogueNode.dialogue.mode}`));
    console.log(chalk.gray(`  Participants: ${dialogueNode.dialogue.participants.join(', ')}`));
    console.log(chalk.gray(`  Max turns: ${dialogueNode.dialogue.maxTurns}\n`));
    
    // Substitute input variables in dialogue prompts
    const processedDialogue = {
      ...dialogueNode.dialogue,
      turns: dialogueNode.dialogue.turns?.map((turn: any) => ({
        ...turn,
        prompt: turn.prompt.replace(/\{\{inputs\.(\w+)\}\}/g, (match: string, key: string) => 
          inputs[key] || match
        )
      }))
    };
    
    try {
      // Setup graceful shutdown
      let shouldStop = false;
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n⚠️  Stopping dialogue gracefully...'));
        shouldStop = true;
      });
      
      // Execute the dialogue with real agent calls
      console.log(chalk.gray('💡 Press Ctrl+C to stop the dialogue at any time\n'));
      const spinner = ora('Executing dialogue turns...').start();
      const runId = `run-${Date.now()}`;
      const result = await dialogueExecutor.executeDialogue(
        { ...dialogueNode, dialogue: processedDialogue },
        inputs,
        runId
      );
      spinner.succeed('Dialogue completed!');
      
      // Display conversation like a chat interface
      console.log(chalk.cyan('\n💬 Full Conversation:\n'));
      const turns = result.output.turns || [];
      turns.forEach((turn: any, index: number) => {
        console.log(boxen(
          chalk.bold.magenta(`${turn.speaker}`) + '\n\n' + chalk.white(turn.response),
          { 
            padding: 1, 
            margin: { top: 0, bottom: 1, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: 'cyan',
            title: `Turn ${index + 1}`,
            titleAlignment: 'left'
          }
        ));
      });
      
      console.log(chalk.green(`\n✅ Dialogue completed with ${turns.length} turns`));
      console.log(chalk.gray(`Total cost: ${result.cost} USDC`));
      
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Dialogue execution failed: ${error.message}`));
      console.log(chalk.yellow('\nFalling back to configuration display mode...\n'));
      
      if (dialogueNode.dialogue.turns && dialogueNode.dialogue.turns.length > 0) {
        console.log(chalk.cyan('📝 Pre-defined conversation flow:\n'));
        dialogueNode.dialogue.turns.forEach((turn: any, index: number) => {
          console.log(chalk.white(`Turn ${index + 1}: ${chalk.bold(turn.speaker)}`));
          console.log(chalk.gray(`  Prompt: ${turn.prompt.substring(0, 100)}...`));
        });
      }
    }
  } else {
    console.log(chalk.yellow('⚠️  No dialogue node found in workflow'));
  }
  
  console.log(chalk.green('\n✅ Workflow execution completed!\n'));
}

async function main() {
  console.clear();
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║     YAML Workflow Executor with Vega Features      ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════╝\n'));

  // Register agents
  await registerAgents();

  // Get available workflows
  const availableWorkflows = getAvailableWorkflows();
  
  // Select workflow
  const choices = availableWorkflows.map(wf => ({
    name: wf.name,
    value: wf.file,
  }));

  const { workflowFile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'workflowFile',
      message: 'Select a workflow to execute:',
      choices,
    },
  ]);
  
  // Load workflow
  const workflow = await loadWorkflow(workflowFile);
  
  // Display workflow info
  displayWorkflowInfo(workflow);

  // Get inputs based on workflow
  let inputs: Record<string, any> = {};
  
  // Check what inputs the workflow needs
  if (workflow.inputs) {
    const inputKeys = Object.keys(workflow.inputs);
    if (inputKeys.includes('marketTopic')) {
      const { marketTopic } = await inquirer.prompt([{
        type: 'input',
        name: 'marketTopic',
        message: 'Enter a market topic to analyze:',
        default: 'AI-powered personal finance apps',
      }]);
      inputs = { marketTopic };
    } else if (inputKeys.includes('productIdea')) {
      const { productIdea } = await inquirer.prompt([{
        type: 'input',
        name: 'productIdea',
        message: 'Enter a product idea to discuss:',
        default: 'An AI-powered personal finance assistant app',
      }]);
      inputs = { productIdea };
    }
  } else {
    // Default fallback
    const { productIdea } = await inquirer.prompt([{
      type: 'input',
      name: 'productIdea',
      message: 'Enter a product idea to discuss:',
      default: 'An AI-powered personal finance assistant app',
    }]);
    inputs = { productIdea };
  }

  // Execute
  await executeSimpleWorkflow(workflow, inputs);

  console.log(chalk.cyan('\n📚 Next Steps:\n'));
  console.log(chalk.white('• Review the workflow configuration above'));
  console.log(chalk.white('• Check VEGA_ADVANCED_FEATURES.md for full documentation'));
  console.log(chalk.white('• Modify YAML files in /workflows to customize behavior'));
  console.log(chalk.white('• All features (schedules, ticks, dialogues) are configured!\n'));
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message);
  console.error(error.stack);
  process.exit(1);
});
