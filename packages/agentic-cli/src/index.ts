import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { runWorkflow } from './commands/run.js';
import { registerAgent } from './commands/register.js';
import { listAgents } from './commands/list.js';
import { validateWorkflow } from './commands/validate.js';
import { initWorkflow } from './commands/init.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('Vega CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
    })
  )
);

console.log(chalk.gray('  Vega Protocol - Workflow orchestration made simple\n'));

program
  .name('vega')
  .description('CLI tool for running Vega Protocol workflows')
  .version('1.0.0');

// Run workflow command
program
  .command('run')
  .description('Run a workflow from YAML file')
  .argument('<file>', 'Path to workflow YAML file')
  .option('-i, --inputs <json>', 'Workflow inputs as JSON string')
  .option('-w, --watch', 'Watch for changes and re-run')
  .option('-v, --verbose', 'Verbose output')
  .option('--no-color', 'Disable colored output')
  .action(runWorkflow);

// Register agent command
program
  .command('register')
  .description('Register an agent in the registry')
  .argument('<file>', 'Path to agent definition file (JSON/YAML)')
  .option('-f, --force', 'Force overwrite if agent exists')
  .option('-v, --verbose', 'Verbose output')
  .action(registerAgent);

// List agents command
program
  .command('list')
  .alias('ls')
  .description('List registered agents')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('-s, --search <query>', 'Search agents by name or description')
  .option('-j, --json', 'Output as JSON')
  .action(listAgents);

// Validate workflow command
program
  .command('validate')
  .description('Validate a workflow YAML file')
  .argument('<file>', 'Path to workflow YAML file')
  .option('-v, --verbose', 'Verbose output')
  .action(validateWorkflow);

// Init workflow command
program
  .command('init')
  .description('Initialize a new workflow YAML file')
  .argument('[name]', 'Workflow name')
  .option('-t, --template <type>', 'Template type (basic, advanced, pipeline)', 'basic')
  .option('-o, --output <file>', 'Output file path', './workflow.yaml')
  .action(initWorkflow);

// Status command
program
  .command('status')
  .description('Check status of a running workflow')
  .argument('<id>', 'Workflow execution ID')
  .option('-w, --watch', 'Watch status updates')
  .option('-j, --json', 'Output as JSON')
  .action(statusCommand);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
