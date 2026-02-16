#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import boxen from 'boxen';

interface AgentResponse {
  success: boolean;
  perspective: string;
  response: string;
  focus: string[];
}

const AGENTS = {
  CEO: { port: 3010, emoji: '🎯', title: 'Chief Executive Officer' },
  CTO: { port: 3011, emoji: '💻', title: 'Chief Technology Officer' },
  CMO: { port: 3012, emoji: '📢', title: 'Chief Marketing Officer' },
};

async function callAgent(
  agentType: keyof typeof AGENTS,
  productIdea: string,
  previousDiscussion: string[]
): Promise<AgentResponse> {
  const agent = AGENTS[agentType];
  const response = await axios.post(`http://localhost:${agent.port}/execute`, {
    productIdea,
    previousDiscussion,
  });
  return response.data;
}

function displayResponse(agentType: keyof typeof AGENTS, response: string) {
  const agent = AGENTS[agentType];
  console.log('\n');
  console.log(
    boxen(
      chalk.bold.cyan(`${agent.emoji} ${agentType} - ${agent.title}`) +
        '\n\n' +
        chalk.white(response),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );
}

async function runDiscussion(productIdea: string, rounds: number = 2) {
  console.log(chalk.cyan.bold('\n🚀 Starting Executive Product Discussion\n'));
  console.log(chalk.gray(`Product Idea: ${chalk.white(productIdea)}`));
  console.log(chalk.gray(`Discussion Rounds: ${chalk.white(rounds)}\n`));

  const discussion: string[] = [];

  for (let round = 1; round <= rounds; round++) {
    console.log(chalk.yellow.bold(`\n═══ Round ${round} ═══\n`));

    // CEO speaks first
    const ceoSpinner = ora(`${AGENTS.CEO.emoji} CEO analyzing product...`).start();
    try {
      const ceoResponse = await callAgent('CEO', productIdea, discussion);
      ceoSpinner.succeed(chalk.green(`${AGENTS.CEO.emoji} CEO analysis complete`));
      displayResponse('CEO', ceoResponse.response);
      discussion.push(`CEO (Round ${round}): ${ceoResponse.response}`);
    } catch (error) {
      ceoSpinner.fail(chalk.red('CEO agent failed'));
      throw error;
    }

    // CTO speaks second
    const ctoSpinner = ora(`${AGENTS.CTO.emoji} CTO evaluating technical aspects...`).start();
    try {
      const ctoResponse = await callAgent('CTO', productIdea, discussion);
      ctoSpinner.succeed(chalk.green(`${AGENTS.CTO.emoji} CTO analysis complete`));
      displayResponse('CTO', ctoResponse.response);
      discussion.push(`CTO (Round ${round}): ${ctoResponse.response}`);
    } catch (error) {
      ctoSpinner.fail(chalk.red('CTO agent failed'));
      throw error;
    }

    // CMO speaks third
    const cmoSpinner = ora(`${AGENTS.CMO.emoji} CMO developing marketing strategy...`).start();
    try {
      const cmoResponse = await callAgent('CMO', productIdea, discussion);
      cmoSpinner.succeed(chalk.green(`${AGENTS.CMO.emoji} CMO analysis complete`));
      displayResponse('CMO', cmoResponse.response);
      discussion.push(`CMO (Round ${round}): ${cmoResponse.response}`);
    } catch (error) {
      cmoSpinner.fail(chalk.red('CMO agent failed'));
      throw error;
    }
  }

  // Summary
  console.log('\n');
  console.log(
    boxen(
      chalk.bold.green('✅ Discussion Complete!') +
        '\n\n' +
        chalk.white(`The executive team has completed ${rounds} rounds of discussion.`) +
        '\n' +
        chalk.white(`Total insights shared: ${discussion.length}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
      }
    )
  );

  return discussion;
}

async function checkAgents() {
  console.log(chalk.cyan('Checking agent availability...\n'));
  
  for (const [name, agent] of Object.entries(AGENTS)) {
    try {
      await axios.get(`http://localhost:${agent.port}/health`, { timeout: 2000 });
      console.log(chalk.green(`✓ ${agent.emoji} ${name} agent is running on port ${agent.port}`));
    } catch (error) {
      console.log(chalk.red(`✗ ${agent.emoji} ${name} agent is not running on port ${agent.port}`));
      console.log(chalk.yellow(`  Start it with: bun run agents/${name.toLowerCase()}-agent.ts\n`));
      return false;
    }
  }
  console.log();
  return true;
}

async function main() {
  console.log(
    chalk.cyan(
      `
  ╔═══════════════════════════════════════════╗
  ║   Executive Product Discussion System    ║
  ║   CEO 🎯 | CTO 💻 | CMO 📢              ║
  ╚═══════════════════════════════════════════╝
  `
    )
  );

  // Check if agents are running
  const agentsReady = await checkAgents();
  if (!agentsReady) {
    console.log(chalk.red('\n❌ Please start all agents before running the discussion.\n'));
    console.log(chalk.yellow('Start agents with:'));
    console.log(chalk.white('  bun run agents/ceo-agent.ts'));
    console.log(chalk.white('  bun run agents/cto-agent.ts'));
    console.log(chalk.white('  bun run agents/cmo-marketing-agent.ts\n'));
    process.exit(1);
  }

  // Get product idea from user
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'productIdea',
      message: 'What product would you like the executives to discuss?',
      validate: (input) => (input.trim() ? true : 'Please enter a product idea'),
    },
    {
      type: 'number',
      name: 'rounds',
      message: 'How many discussion rounds?',
      default: 2,
      validate: (input) => (input >= 1 && input <= 5 ? true : 'Please enter 1-5 rounds'),
    },
  ]);

  try {
    const discussion = await runDiscussion(answers.productIdea, answers.rounds);

    // Ask if user wants another discussion
    const { again } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'again',
        message: 'Would you like to discuss another product?',
        default: false,
      },
    ]);

    if (again) {
      await main();
    } else {
      console.log(chalk.cyan('\n👋 Thank you for using the Executive Discussion System!\n'));
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error during discussion:'), error);
    process.exit(1);
  }
}

main();
