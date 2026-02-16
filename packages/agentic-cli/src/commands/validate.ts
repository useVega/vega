import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { WorkflowYAMLParser } from '../utils/parser.js';
import { logger } from '../utils/logger.js';

interface ValidateOptions {
  verbose?: boolean;
}

export async function validateWorkflow(file: string, options: ValidateOptions) {
  const spinner = ora('Loading workflow file...').start();

  try {
    // Read workflow file
    const filePath = resolve(process.cwd(), file);
    const content = readFileSync(filePath, 'utf-8');
    
    spinner.text = 'Validating workflow...';
    
    const parser = new WorkflowYAMLParser();
    const result = parser.parse(content);

    if (!result.valid) {
      spinner.fail(chalk.red('Workflow validation failed'));
      console.log();
      
      logger.error(`Found ${result.errors?.length || 0} error(s):\n`);
      
      result.errors?.forEach((error, i) => {
        console.log(chalk.red(`  ${i + 1}. [${error.type.toUpperCase()}] ${error.message}`));
        if (error.path) {
          console.log(chalk.gray(`     Path: ${error.path}`));
        }
        if (error.line) {
          console.log(chalk.gray(`     Line: ${error.line}`));
        }
        console.log();
      });

      process.exit(1);
    }

    const workflow = result.workflow!;
    spinner.succeed(chalk.green('Workflow is valid'));

    // Display workflow summary
    console.log();
    console.log(chalk.cyan('Workflow Summary:'));
    console.log(chalk.gray('  Name:         ') + chalk.white(workflow.name));
    console.log(chalk.gray('  Version:      ') + chalk.white(workflow.version));
    console.log(chalk.gray('  Description:  ') + chalk.white(workflow.description));
    console.log(chalk.gray('  Nodes:        ') + chalk.white(workflow.nodes.length));
    console.log(chalk.gray('  Edges:        ') + chalk.white(workflow.edges.length));
    console.log(chalk.gray('  Inputs:       ') + chalk.white(Object.keys(workflow.inputs).length));
    console.log(chalk.gray('  Outputs:      ') + chalk.white(Object.keys(workflow.outputs).length));
    console.log(chalk.gray('  Max Budget:   ') + chalk.white(`${workflow.maxBudget} ${workflow.token}`));

    if (options.verbose) {
      console.log();
      console.log(chalk.cyan('Nodes:'));
      workflow.nodes.forEach((node, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${node.id}`));
        console.log(chalk.gray(`     Agent: ${node.ref}`));
        console.log(chalk.gray(`     Name:  ${node.name}`));
      });

      if (workflow.edges.length > 0) {
        console.log();
        console.log(chalk.cyan('Edges:'));
        workflow.edges.forEach((edge, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${edge.from} → ${edge.to}`));
          if (edge.condition) {
            console.log(chalk.gray(`     Condition: ${edge.condition}`));
          }
        });
      }
    }

    console.log();
    logger.success('Workflow is ready to run');

  } catch (error) {
    spinner.fail(chalk.red('Validation failed'));
    console.log();
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    if (options.verbose && error instanceof Error) {
      console.log(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
