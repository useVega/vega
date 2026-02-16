import { WorkflowYAMLParser } from '../src';
import type { WorkflowDefinition } from '../src';

/**
 * Example 1: Parse a YAML workflow file
 */
function example1ParseYAML() {
  console.log('\n=== Example 1: Parse YAML ===\n');

  const parser = new WorkflowYAMLParser();

  const yamlContent = `
name: "Text Processing Pipeline"
version: "1.0.0"
description: "Process and transform text data"
chain: "base"
token: "USDC"
maxBudget: "5.0"

inputs:
  text:
    type: string
    description: "Input text to process"
    required: true

outputs:
  processed:
    type: string
    description: "Processed text"
    value: "{{transform.output}}"

nodes:
  - id: validate
    ref: text-validator-v1
    name: "Validate Input"
    description: "Validate input text"
    inputs:
      text: "{{inputs.text}}"
  
  - id: transform
    ref: text-transformer-v1
    name: "Transform Text"
    description: "Transform the text"
    inputs:
      text: "{{validate.output}}"
      mode: "uppercase"

edges:
  - from: validate
    to: transform
  - from: transform
    to: output
`;

  const result = parser.parse(yamlContent);

  if (result.valid) {
    console.log('✅ Workflow parsed successfully!');
    console.log('\nWorkflow Name:', result.workflow?.name);
    console.log('Nodes:', result.workflow?.nodes.length);
    console.log('Budget:', result.workflow?.maxBudget, result.workflow?.token);
    console.log('\nFull workflow:');
    console.log(JSON.stringify(result.workflow, null, 2));
  } else {
    console.error('❌ Parsing failed:');
    result.errors?.forEach((err) => {
      console.error(`  - [${err.type}] ${err.message}`);
    });
  }
}

/**
 * Example 2: Generate YAML from workflow object
 */
function example2GenerateYAML() {
  console.log('\n=== Example 2: Generate YAML ===\n');

  const parser = new WorkflowYAMLParser();

  const workflow: WorkflowDefinition = {
    name: 'Data Analysis Pipeline',
    version: '1.0.0',
    description: 'Analyze and visualize data',
    chain: 'base',
    token: 'USDC',
    maxBudget: '10.0',
    inputs: {
      dataset: {
        type: 'string',
        description: 'Dataset URL',
        required: true,
      },
      options: {
        type: 'object',
        description: 'Analysis options',
        required: false,
        default: '{}',
      },
    },
    outputs: {
      report: {
        type: 'string',
        description: 'Analysis report',
        value: '{{analyze.report}}',
      },
      chart: {
        type: 'string',
        description: 'Visualization chart',
        value: '{{visualize.chart}}',
      },
    },
    nodes: [
      {
        id: 'fetch',
        ref: 'data-fetcher-v1',
        name: 'Fetch Data',
        description: 'Fetch dataset from URL',
        inputs: {
          url: '{{inputs.dataset}}',
        },
      },
      {
        id: 'analyze',
        ref: 'data-analyzer-v1',
        name: 'Analyze Data',
        description: 'Perform statistical analysis',
        inputs: {
          data: '{{fetch.data}}',
          options: '{{inputs.options}}',
        },
        retry: {
          maxAttempts: 3,
          backoffMs: 2000,
        },
      },
      {
        id: 'visualize',
        ref: 'chart-generator-v1',
        name: 'Generate Chart',
        description: 'Create visualization',
        inputs: {
          data: '{{analyze.results}}',
          type: 'bar',
        },
      },
    ],
    edges: [
      { from: 'fetch', to: 'analyze' },
      { from: 'analyze', to: 'visualize' },
      { from: 'visualize', to: 'output' },
    ],
    metadata: {
      tags: ['data', 'analysis', 'visualization'],
      author: 'system',
      createdAt: new Date().toISOString(),
    },
  };

  const yaml = parser.stringify(workflow);

  console.log('Generated YAML:\n');
  console.log(yaml);
}

/**
 * Example 3: Generate a template
 */
function example3GenerateTemplate() {
  console.log('\n=== Example 3: Generate Template ===\n');

  const parser = new WorkflowYAMLParser();
  const template = parser.generateTemplate();

  console.log('Workflow Template:\n');
  console.log(template);
}

/**
 * Example 4: Error handling
 */
function example4ErrorHandling() {
  console.log('\n=== Example 4: Error Handling ===\n');

  const parser = new WorkflowYAMLParser();

  // Invalid YAML - missing required fields
  const invalidYAML = `
name: "Incomplete Workflow"
nodes:
  - id: step1
    ref: some-agent-v1
`;

  const result = parser.parse(invalidYAML);

  if (!result.valid) {
    console.log('Expected validation errors:');
    result.errors?.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.message}`);
      console.log(`   Type: ${err.type}`);
      if (err.path) console.log(`   Path: ${err.path}`);
    });
  }
}

/**
 * Example 5: Validate workflow logic
 */
function example5ValidateLogic() {
  console.log('\n=== Example 5: Validate Logic ===\n');

  const parser = new WorkflowYAMLParser();

  // Workflow with invalid node reference in edge
  const yamlWithBadEdge = `
name: "Invalid Workflow"
version: "1.0.0"
description: "Workflow with invalid edge"
chain: "base"
token: "USDC"
maxBudget: "5.0"

nodes:
  - id: step1
    ref: agent-v1
    name: "Step 1"
    inputs: {}

edges:
  - from: step1
    to: nonexistent
`;

  const result = parser.parse(yamlWithBadEdge);

  if (!result.valid) {
    console.log('Validation caught invalid edge:');
    result.errors?.forEach((err) => {
      console.log(`❌ ${err.message}`);
    });
  }
}

/**
 * Example 6: Working with inputs and outputs
 */
function example6InputsOutputs() {
  console.log('\n=== Example 6: Inputs and Outputs ===\n');

  const parser = new WorkflowYAMLParser();

  const workflow: WorkflowDefinition = {
    name: 'Calculator Workflow',
    version: '1.0.0',
    description: 'Perform calculations',
    chain: 'base',
    token: 'USDC',
    maxBudget: '1.0',
    inputs: {
      a: {
        type: 'number',
        description: 'First number',
        required: true,
      },
      b: {
        type: 'number',
        description: 'Second number',
        required: true,
      },
      operation: {
        type: 'string',
        description: 'Operation to perform',
        required: false,
        default: 'add',
      },
    },
    outputs: {
      result: {
        type: 'number',
        description: 'Calculation result',
        value: '{{calculate.result}}',
      },
    },
    nodes: [
      {
        id: 'calculate',
        ref: 'calculator-v1',
        name: 'Calculate',
        description: 'Perform calculation',
        inputs: {
          a: '{{inputs.a}}',
          b: '{{inputs.b}}',
          op: '{{inputs.operation}}',
        },
      },
    ],
    edges: [
      { from: 'calculate', to: 'output' },
    ],
  };

  console.log('Workflow with parameterized inputs:');
  console.log('\nInputs:');
  Object.entries(workflow.inputs).forEach(([key, input]) => {
    console.log(`  ${key}: ${input.type}${input.required ? ' (required)' : ''}`);
    if (input.default) console.log(`    default: ${input.default}`);
  });

  console.log('\nOutputs:');
  Object.entries(workflow.outputs).forEach(([key, output]) => {
    console.log(`  ${key}: ${output.type}`);
    console.log(`    value: ${output.value}`);
  });

  const yaml = parser.stringify(workflow);
  console.log('\nGenerated YAML:\n');
  console.log(yaml);
}

// Run all examples
if (require.main === module) {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Agentic Client Library Examples     ║');
  console.log('╚════════════════════════════════════════╝');

  example1ParseYAML();
  example2GenerateYAML();
  example3GenerateTemplate();
  example4ErrorHandling();
  example5ValidateLogic();
  example6InputsOutputs();

  console.log('\n✨ All examples completed!\n');
}

export {
  example1ParseYAML,
  example2GenerateYAML,
  example3GenerateTemplate,
  example4ErrorHandling,
  example5ValidateLogic,
  example6InputsOutputs,
};
