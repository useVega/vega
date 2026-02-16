import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { parse } from 'yaml';
import boxen from 'boxen';
import { AgentRegistry } from '../utils/agent-registry.js';
import { logger } from '../utils/logger.js';

interface RegisterOptions {
  force?: boolean;
  verbose?: boolean;
}

interface AgentDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  endpoint?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[];
  pricing?: {
    model: string;
    basePrice: string;
  };
}

export async function registerAgent(file: string, options: RegisterOptions) {
  const spinner = ora('Loading agent definition...').start();

  try {
    // Read agent definition file
    const filePath = resolve(process.cwd(), file);
    const content = readFileSync(filePath, 'utf-8');
    
    let agent: AgentDefinition;
    
    // Parse based on file extension
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      agent = parse(content);
    } else if (filePath.endsWith('.json')) {
      agent = JSON.parse(content);
    } else {
      spinner.fail(chalk.red('Unsupported file format'));
      logger.error('Agent definition must be JSON or YAML');
      process.exit(1);
    }

    spinner.text = 'Validating agent definition...';

    // Validate required fields
    const requiredFields = ['id', 'name', 'version', 'description'];
    const missing = requiredFields.filter(field => !agent[field as keyof AgentDefinition]);
    
    if (missing.length > 0) {
      spinner.fail(chalk.red('Invalid agent definition'));
      console.log();
      logger.error(`Missing required fields: ${missing.join(', ')}`);
      process.exit(1);
    }

    spinner.succeed(chalk.green('Agent definition loaded'));

    // Display agent info
    console.log();
    console.log(boxen(
      chalk.cyan.bold('Agent Registration') + '\n\n' +
      chalk.gray('ID:          ') + chalk.white(agent.id) + '\n' +
      chalk.gray('Name:        ') + chalk.white(agent.name) + '\n' +
      chalk.gray('Version:     ') + chalk.white(agent.version) + '\n' +
      chalk.gray('Description: ') + chalk.white(agent.description) + '\n' +
      (agent.tags ? chalk.gray('Tags:        ') + chalk.white(agent.tags.join(', ')) + '\n' : '') +
      (agent.endpoint ? chalk.gray('Endpoint:    ') + chalk.white(agent.endpoint) : ''),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

    // Initialize registry
    spinner.start('Registering agent...');
    const registry = new AgentRegistry();

    // Check if agent exists
    const exists = await registry.exists(agent.id);
    
    if (exists && !options.force) {
      spinner.fail(chalk.yellow('Agent already exists'));
      console.log();
      logger.warn(`Agent ${agent.id} is already registered`);
      logger.info('Use --force to overwrite existing agent');
      process.exit(1);
    }

    // Register agent
    await registry.register({
      id: agent.id,
      name: agent.name,
      version: agent.version,
      description: agent.description,
      endpoint: agent.endpoint,
      inputs: agent.inputs || {},
      outputs: agent.outputs || {},
      tags: agent.tags || [],
      pricing: agent.pricing,
    });

    spinner.succeed(chalk.green('Agent registered successfully'));

    if (exists && options.force) {
      logger.info('Existing agent was overwritten');
    }

    console.log();
    logger.success(`Agent ${chalk.bold(agent.id)} is now available for workflows`);

  } catch (error) {
    spinner.fail(chalk.red('Agent registration failed'));
    console.log();
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    if (options.verbose && error instanceof Error) {
      console.log(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
