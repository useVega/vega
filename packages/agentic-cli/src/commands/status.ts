import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';
import { logger } from '../utils/logger.js';

interface StatusOptions {
  watch?: boolean;
  json?: boolean;
}

export async function statusCommand(id: string, options: StatusOptions) {
  const spinner = ora('Fetching workflow status...').start();

  try {
    // Mock execution status (replace with actual status fetching)
    const status = {
      id,
      name: 'Example Workflow',
      status: 'running',
      progress: 65,
      startedAt: new Date().toISOString(),
      nodes: [
        { id: 'step1', status: 'completed', duration: 1234 },
        { id: 'step2', status: 'running', duration: 0 },
        { id: 'step3', status: 'pending', duration: 0 },
      ],
    };

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    // Display status
    console.log();
    console.log(boxen(
      chalk.cyan.bold('Workflow Status') + '\n\n' +
      chalk.gray('ID:       ') + chalk.white(status.id) + '\n' +
      chalk.gray('Name:     ') + chalk.white(status.name) + '\n' +
      chalk.gray('Status:   ') + getStatusColor(status.status) + '\n' +
      chalk.gray('Progress: ') + getProgressBar(status.progress) + '\n' +
      chalk.gray('Started:  ') + chalk.white(new Date(status.startedAt).toLocaleString()),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    ));

    // Node status table
    const table = new Table({
      head: [
        chalk.cyan('Node'),
        chalk.cyan('Status'),
        chalk.cyan('Duration')
      ],
      colWidths: [20, 20, 15],
    });

    status.nodes.forEach(node => {
      table.push([
        node.id,
        getStatusIcon(node.status) + ' ' + node.status,
        node.duration ? `${node.duration}ms` : '-'
      ]);
    });

    console.log(table.toString());
    console.log();

    if (options.watch) {
      logger.info('Watching for updates... (Press Ctrl+C to stop)');
      // TODO: Implement watch mode
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch status'));
    console.log();
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('✓ Completed');
    case 'running':
      return chalk.yellow('◉ Running');
    case 'failed':
      return chalk.red('✗ Failed');
    case 'pending':
      return chalk.gray('○ Pending');
    default:
      return chalk.white(status);
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('✓');
    case 'running':
      return chalk.yellow('◉');
    case 'failed':
      return chalk.red('✗');
    case 'pending':
      return chalk.gray('○');
    default:
      return '·';
  }
}

function getProgressBar(progress: number): string {
  const total = 20;
  const filled = Math.floor(progress / 100 * total);
  const empty = total - filled;
  
  return chalk.green('█'.repeat(filled)) + 
         chalk.gray('░'.repeat(empty)) + 
         chalk.white(` ${progress}%`);
}
