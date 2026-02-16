import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { parse } from 'yaml';
import Table from 'cli-table3';
import { WorkflowYAMLParser } from '../utils/parser.js';
import { ExecutionEngine } from '../utils/execution-engine.js';
import { logger } from '../utils/logger.js';

interface RunOptions {
  inputs?: string;
  watch?: boolean;
  verbose?: boolean;
  color?: boolean;
}

export async function runWorkflow(file: string, options: RunOptions) {
  const spinner = ora('Loading workflow...').start();

  try {
    // Read and parse workflow file
    const filePath = resolve(process.cwd(), file);
    const content = readFileSync(filePath, 'utf-8');
    
    spinner.text = 'Parsing workflow YAML...';
    const parser = new WorkflowYAMLParser();
    const result = parser.parse(content);

    if (!result.valid) {
      spinner.fail(chalk.red('Workflow validation failed'));
      console.log();
      logger.error('Validation errors:');
      result.errors?.forEach((error, i) => {
        console.log(chalk.red(`  ${i + 1}. [${error.type}] ${error.message}`));
        if (error.path) {
          console.log(chalk.gray(`     at: ${error.path}`));
        }
      });
      process.exit(1);
    }

    const workflow = result.workflow!;
    spinner.succeed(chalk.green(`Workflow loaded: ${chalk.bold(workflow.name)}`));

    // Display workflow info
    console.log();
    console.log(chalk.cyan('Workflow Details:'));
    console.log(chalk.gray('  Name:        ') + chalk.white(workflow.name));
    console.log(chalk.gray('  Version:     ') + chalk.white(workflow.version));
    console.log(chalk.gray('  Description: ') + chalk.white(workflow.description));
    console.log(chalk.gray('  Chain:       ') + chalk.white(workflow.chain));
    console.log(chalk.gray('  Budget:      ') + chalk.white(`${workflow.maxBudget} ${workflow.token}`));
    console.log(chalk.gray('  Nodes:       ') + chalk.white(workflow.nodes.length));
    console.log();

    // Parse inputs
    let inputs = {};
    if (options.inputs) {
      try {
        inputs = JSON.parse(options.inputs);
        logger.info('Using provided inputs');
        if (options.verbose) {
          console.log(chalk.gray('  Inputs: ') + JSON.stringify(inputs, null, 2));
        }
      } catch (err) {
        logger.error('Invalid JSON in --inputs option');
        process.exit(1);
      }
    }

    // Create execution engine
    const engine = new ExecutionEngine(workflow, {
      verbose: options.verbose || false,
    });

    // Execute workflow
    console.log(chalk.bold.cyan('🎬 Executive Discussion Starting...'));
    console.log(chalk.gray('═'.repeat(80)));
    
    const startTime = Date.now();
    const executionResult = await engine.execute(inputs);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (executionResult.status === 'completed') {
      console.log();
      console.log(chalk.gray('═'.repeat(80)));
      console.log(chalk.green(`✅ Discussion completed in ${duration}s`));
      
      // Display final outputs
      if (executionResult.outputs && Object.keys(executionResult.outputs).length > 0) {
        console.log();
        console.log(chalk.bold.cyan('📊 Final Summary:'));
        console.log(chalk.gray('═'.repeat(80)));
        
        // Display summary specially
        if (executionResult.outputs.summary) {
          const summary = executionResult.outputs.summary;
          const summaryText = typeof summary === 'object' && summary.summary ? summary.summary : 
                            typeof summary === 'string' ? summary : JSON.stringify(summary);
          console.log(chalk.white(summaryText));
        }
        
        // Display other outputs
        Object.entries(executionResult.outputs).forEach(([key, value]) => {
          if (key !== 'summary') {
            console.log();
            console.log(chalk.cyan(`${key}:`));
            console.log(chalk.gray(typeof value === 'string' ? value : JSON.stringify(value, null, 2)));
          }
        });
      }

      console.log();
      logger.success('Workflow execution completed successfully');
    } else if (executionResult.status === 'failed') {
      spinner.fail(chalk.red('Workflow execution failed'));
      
      if (executionResult.error) {
        console.log();
        logger.error('Error details:');
        console.log(chalk.red('  ' + executionResult.error));
      }

      process.exit(1);
    }

  } catch (error) {
    spinner.fail(chalk.red('Workflow execution failed'));
    console.log();
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    if (options.verbose && error instanceof Error) {
      console.log(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
