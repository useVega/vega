import { writeFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { WorkflowYAMLParser } from '../utils/parser.js';
import { logger } from '../utils/logger.js';

interface InitOptions {
  template?: string;
  output?: string;
}

const templates = {
  basic: {
    name: 'Basic Workflow',
    version: '1.0.0',
    description: 'A simple workflow with one agent',
    chain: 'base',
    token: 'USDC',
    maxBudget: '5.0',
    inputs: {
      text: {
        type: 'string',
        description: 'Input text',
        required: true,
      },
    },
    outputs: {
      result: {
        type: 'string',
        description: 'Processed result',
        value: '{{process.output}}',
      },
    },
    nodes: [
      {
        id: 'process',
        ref: 'text-processor-v1',
        name: 'Process Text',
        description: 'Process the input text',
        inputs: {
          text: '{{inputs.text}}',
        },
      },
    ],
    edges: [
      {
        from: 'process',
        to: 'output',
      },
    ],
  },

  advanced: {
    name: 'Advanced Workflow',
    version: '1.0.0',
    description: 'Multi-step workflow with conditional logic',
    chain: 'base',
    token: 'USDC',
    maxBudget: '10.0',
    inputs: {
      data: {
        type: 'string',
        description: 'Input data',
        required: true,
      },
      mode: {
        type: 'string',
        description: 'Processing mode',
        required: false,
        default: 'standard',
      },
    },
    outputs: {
      result: {
        type: 'string',
        description: 'Final result',
        value: '{{transform.output}}',
      },
      metadata: {
        type: 'object',
        description: 'Processing metadata',
        value: '{{transform.metadata}}',
      },
    },
    nodes: [
      {
        id: 'validate',
        ref: 'validator-v1',
        name: 'Validate Input',
        description: 'Validate input data',
        inputs: {
          data: '{{inputs.data}}',
        },
        retry: {
          maxAttempts: 3,
          backoffMs: 1000,
        },
      },
      {
        id: 'transform',
        ref: 'transformer-v1',
        name: 'Transform Data',
        description: 'Transform validated data',
        inputs: {
          data: '{{validate.output}}',
          mode: '{{inputs.mode}}',
        },
      },
    ],
    edges: [
      {
        from: 'validate',
        to: 'transform',
        condition: '{{validate.success}}',
      },
      {
        from: 'transform',
        to: 'output',
      },
    ],
  },

  pipeline: {
    name: 'Data Pipeline',
    version: '1.0.0',
    description: 'Sequential data processing pipeline',
    chain: 'base',
    token: 'USDC',
    maxBudget: '15.0',
    tags: ['data', 'pipeline', 'processing'],
    inputs: {
      source: {
        type: 'string',
        description: 'Data source URL',
        required: true,
      },
    },
    outputs: {
      processed: {
        type: 'object',
        description: 'Processed data',
        value: '{{aggregate.result}}',
      },
    },
    nodes: [
      {
        id: 'fetch',
        ref: 'data-fetcher-v1',
        name: 'Fetch Data',
        description: 'Fetch data from source',
        inputs: {
          url: '{{inputs.source}}',
        },
      },
      {
        id: 'clean',
        ref: 'data-cleaner-v1',
        name: 'Clean Data',
        description: 'Clean and normalize data',
        inputs: {
          data: '{{fetch.data}}',
        },
      },
      {
        id: 'transform',
        ref: 'data-transformer-v1',
        name: 'Transform Data',
        description: 'Transform data format',
        inputs: {
          data: '{{clean.data}}',
        },
      },
      {
        id: 'aggregate',
        ref: 'data-aggregator-v1',
        name: 'Aggregate Results',
        description: 'Aggregate processed results',
        inputs: {
          data: '{{transform.data}}',
        },
      },
    ],
    edges: [
      { from: 'fetch', to: 'clean' },
      { from: 'clean', to: 'transform' },
      { from: 'transform', to: 'aggregate' },
      { from: 'aggregate', to: 'output' },
    ],
  },
};

export async function initWorkflow(name?: string, options?: InitOptions) {
  console.log();
  console.log(chalk.cyan.bold('Initialize New Workflow\n'));

  try {
    // Prompt for workflow details if not provided
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Workflow name:',
        default: name || 'My Workflow',
        when: !name,
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select template:',
        choices: [
          { name: 'Basic - Simple single-agent workflow', value: 'basic' },
          { name: 'Advanced - Multi-step with conditions', value: 'advanced' },
          { name: 'Pipeline - Sequential data processing', value: 'pipeline' },
        ],
        default: options?.template || 'basic',
        when: !options?.template,
      },
      {
        type: 'input',
        name: 'output',
        message: 'Output file:',
        default: options?.output || './workflow.yaml',
        when: !options?.output,
      },
    ]);

    const workflowName = name || answers.name;
    const templateType = (options?.template || answers.template) as keyof typeof templates;
    const outputFile = options?.output || answers.output;

    const spinner = ora('Generating workflow...').start();

    // Get template
    const template = templates[templateType];
    if (!template) {
      spinner.fail(chalk.red('Invalid template type'));
      process.exit(1);
    }

    // Update name if provided
    if (workflowName) {
      template.name = workflowName;
    }

    // Generate YAML
    const parser = new WorkflowYAMLParser();
    const yaml = parser.stringify(template as any);

    // Write to file
    const filePath = resolve(process.cwd(), outputFile);
    writeFileSync(filePath, yaml, 'utf-8');

    spinner.succeed(chalk.green('Workflow created successfully'));

    console.log();
    console.log(chalk.cyan('Workflow Details:'));
    console.log(chalk.gray('  Name:     ') + chalk.white(template.name));
    console.log(chalk.gray('  Template: ') + chalk.white(templateType));
    console.log(chalk.gray('  File:     ') + chalk.white(filePath));
    console.log(chalk.gray('  Nodes:    ') + chalk.white(template.nodes.length));

    console.log();
    logger.success('Workflow file created');
    logger.info(`Run with: ${chalk.bold(`agentic run ${outputFile}`)}`);

  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
