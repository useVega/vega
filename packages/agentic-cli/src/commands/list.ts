import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { AgentRegistry } from '../utils/agent-registry.js';
import { logger } from '../utils/logger.js';

interface ListOptions {
  tags?: string;
  search?: string;
  json?: boolean;
}

export async function listAgents(options: ListOptions) {
  const spinner = ora('Loading registered agents...').start();

  try {
    const registry = new AgentRegistry();
    let agents = await registry.listAll();

    // Filter by tags if provided
    if (options.tags) {
      const filterTags = options.tags.split(',').map(t => t.trim());
      agents = agents.filter(agent => 
        agent.tags?.some(tag => filterTags.includes(tag))
      );
    }

    // Filter by search query if provided
    if (options.search) {
      const query = options.search.toLowerCase();
      agents = agents.filter(agent =>
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query) ||
        agent.id.toLowerCase().includes(query)
      );
    }

    spinner.stop();

    if (agents.length === 0) {
      console.log();
      logger.warn('No agents found matching your criteria');
      return;
    }

    // JSON output
    if (options.json) {
      console.log(JSON.stringify(agents, null, 2));
      return;
    }

    // Table output
    console.log();
    console.log(chalk.cyan.bold(`Found ${agents.length} agent(s):\n`));

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Name'),
        chalk.cyan('Version'),
        chalk.cyan('Description'),
        chalk.cyan('Tags')
      ],
      colWidths: [25, 20, 10, 35, 20],
      wordWrap: true,
    });

    agents.forEach(agent => {
      table.push([
        agent.id,
        agent.name,
        agent.version,
        agent.description || '-',
        agent.tags?.join(', ') || '-'
      ]);
    });

    console.log(table.toString());
    console.log();
    logger.info(`Total: ${chalk.bold(agents.length)} agent(s)`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to list agents'));
    console.log();
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
