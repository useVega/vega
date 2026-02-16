# Agentic CLI

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node">
</p>

**Agentic CLI** - A powerful command-line tool for running agent-based workflows with YAML definitions.

## ✨ Features

- 🚀 **Run Workflows** - Execute multi-agent workflows from YAML files
- 📝 **Agent Registry** - Register and manage agents locally
- ✅ **Validation** - Validate workflow files before execution
- 🎨 **Beautiful Output** - Colorful CLI with progress indicators
- 📊 **Status Tracking** - Monitor workflow execution progress
- 🔧 **Template Generation** - Quick-start with workflow templates

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @agentic-eco/cli
```

### Local Installation

```bash
npm install @agentic-eco/cli
```

### From Source

```bash
git clone https://github.com/agentic-eco/cli.git
cd cli
npm install
npm run build
npm link
```

## 🚀 Quick Start

### 1. Initialize a Workflow

```bash
agentic init my-workflow
```

This creates a `workflow.yaml` file with a basic template.

### 2. Run the Workflow

```bash
agentic run workflow.yaml --inputs '{"text": "Hello World"}'
```

### 3. Register an Agent

```bash
agentic register agent.yaml
```

## 📖 Commands

### `agentic run <file>`

Run a workflow from a YAML file.

```bash
agentic run workflow.yaml [options]
```

**Options:**
- `-i, --inputs <json>` - Workflow inputs as JSON string
- `-w, --watch` - Watch for changes and re-run
- `-v, --verbose` - Verbose output
- `--no-color` - Disable colored output

**Examples:**

```bash
# Run with inputs
agentic run workflow.yaml --inputs '{"text": "Hello"}'

# Verbose mode
agentic run workflow.yaml --verbose

# Watch mode (auto-restart on file changes)
agentic run workflow.yaml --watch
```

### `agentic register <file>`

Register an agent in the local registry.

```bash
agentic register agent.yaml [options]
```

**Options:**
- `-f, --force` - Force overwrite if agent exists
- `-v, --verbose` - Verbose output

**Agent Definition Format (YAML):**

```yaml
id: text-processor-v1
name: Text Processor
version: 1.0.0
description: Processes and transforms text
endpoint: http://localhost:3000/api/process
tags:
  - text
  - processing
inputs:
  text:
    type: string
    description: Input text
outputs:
  result:
    type: string
    description: Processed text
pricing:
  model: per-call
  basePrice: "0.01"
```

**Agent Definition Format (JSON):**

```json
{
  "id": "text-processor-v1",
  "name": "Text Processor",
  "version": "1.0.0",
  "description": "Processes and transforms text",
  "endpoint": "http://localhost:3000/api/process",
  "tags": ["text", "processing"],
  "inputs": {
    "text": {
      "type": "string",
      "description": "Input text"
    }
  },
  "outputs": {
    "result": {
      "type": "string",
      "description": "Processed text"
    }
  }
}
```

### `agentic list` / `agentic ls`

List all registered agents.

```bash
agentic list [options]
```

**Options:**
- `-t, --tags <tags>` - Filter by tags (comma-separated)
- `-s, --search <query>` - Search agents by name or description
- `-j, --json` - Output as JSON

**Examples:**

```bash
# List all agents
agentic list

# Filter by tags
agentic list --tags text,processing

# Search agents
agentic list --search "processor"

# JSON output
agentic list --json
```

### `agentic validate <file>`

Validate a workflow YAML file.

```bash
agentic validate workflow.yaml [options]
```

**Options:**
- `-v, --verbose` - Verbose output with detailed information

**Examples:**

```bash
# Basic validation
agentic validate workflow.yaml

# Verbose validation
agentic validate workflow.yaml --verbose
```

### `agentic init [name]`

Initialize a new workflow YAML file.

```bash
agentic init [name] [options]
```

**Options:**
- `-t, --template <type>` - Template type: `basic`, `advanced`, `pipeline` (default: `basic`)
- `-o, --output <file>` - Output file path (default: `./workflow.yaml`)

**Examples:**

```bash
# Create basic workflow
agentic init

# Create with name
agentic init "My Workflow"

# Use advanced template
agentic init --template advanced

# Custom output file
agentic init --output ./workflows/my-flow.yaml
```

**Templates:**

- **basic** - Simple single-agent workflow
- **advanced** - Multi-step workflow with conditional logic
- **pipeline** - Sequential data processing pipeline

### `agentic status <id>`

Check the status of a running workflow.

```bash
agentic status <execution-id> [options]
```

**Options:**
- `-w, --watch` - Watch status updates in real-time
- `-j, --json` - Output as JSON

## 📄 Workflow YAML Format

A complete workflow YAML file structure:

```yaml
name: "My Workflow"
version: "1.0.0"
description: "Workflow description"

# Execution Configuration
chain: "base"           # base | arbitrum | ethereum | solana
token: "USDC"           # USDC | USDT | ETH | SOL
maxBudget: "10.0"

# Optional Tags
tags:
  - processing
  - data

# Input Parameters
inputs:
  text:
    type: string
    description: "Input text to process"
    required: true
    default: ""

# Output Definitions
outputs:
  result:
    type: string
    description: "Processed result"
    value: "{{transform.output}}"

# Workflow Nodes (Steps)
nodes:
  - id: validate
    ref: validator-v1
    name: "Validate Input"
    description: "Validate the input data"
    inputs:
      text: "{{inputs.text}}"
    retry:
      maxAttempts: 3
      backoffMs: 1000
  
  - id: transform
    ref: transformer-v1
    name: "Transform Data"
    description: "Transform validated data"
    inputs:
      data: "{{validate.output}}"

# Node Connections
edges:
  - from: validate
    to: transform
    condition: "{{validate.success}}"
  - from: transform
    to: output
```

## 🎨 CLI Output

The CLI provides beautiful, colorful output:

- **Spinners** - Loading indicators for operations
- **Progress Bars** - Visual workflow progress
- **Tables** - Structured data display
- **Status Icons** - Visual status indicators
- **Colors** - Syntax highlighting and emphasis

## 🔧 Configuration

### Registry Location

Agents are stored in: `~/.agentic/agents.json`

### Environment Variables

```bash
# Disable colors
export NO_COLOR=1

# Set custom registry path
export AGENTIC_REGISTRY_PATH=/path/to/registry.json
```

## 📚 Examples

### Example 1: Simple Text Processing

**workflow.yaml:**

```yaml
name: "Text Processor"
version: "1.0.0"
description: "Process text input"
chain: "base"
token: "USDC"
maxBudget: "1.0"

inputs:
  text:
    type: string
    required: true

outputs:
  result:
    type: string
    value: "{{process.output}}"

nodes:
  - id: process
    ref: text-processor-v1
    name: "Process Text"
    inputs:
      text: "{{inputs.text}}"

edges:
  - from: process
    to: output
```

**Run:**

```bash
agentic run workflow.yaml --inputs '{"text": "Hello World"}'
```

### Example 2: Multi-Step Pipeline

**pipeline.yaml:**

```yaml
name: "Data Pipeline"
version: "1.0.0"
description: "Fetch, clean, and analyze data"
chain: "base"
token: "USDC"
maxBudget: "5.0"

inputs:
  url:
    type: string
    required: true

outputs:
  report:
    type: object
    value: "{{analyze.report}}"

nodes:
  - id: fetch
    ref: data-fetcher-v1
    name: "Fetch Data"
    inputs:
      url: "{{inputs.url}}"
  
  - id: clean
    ref: data-cleaner-v1
    name: "Clean Data"
    inputs:
      data: "{{fetch.data}}"
  
  - id: analyze
    ref: data-analyzer-v1
    name: "Analyze Data"
    inputs:
      data: "{{clean.data}}"

edges:
  - from: fetch
    to: clean
  - from: clean
    to: analyze
  - from: analyze
    to: output
```

**Run:**

```bash
agentic run pipeline.yaml --inputs '{"url": "https://example.com/data"}'
```

## 🐛 Troubleshooting

### Validation Errors

If you encounter validation errors:

```bash
# Validate your workflow first
agentic validate workflow.yaml --verbose
```

### Agent Not Found

If an agent is not found:

```bash
# List registered agents
agentic list

# Register the missing agent
agentic register agent.yaml
```

### Permission Errors

If you get permission errors accessing the registry:

```bash
# Check registry location
ls -la ~/.agentic/

# Fix permissions if needed
chmod 755 ~/.agentic
chmod 644 ~/.agentic/agents.json
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

MIT © Agentic Ecosystem

## 🔗 Links

- [Documentation](https://docs.agentic-eco.com)
- [GitHub](https://github.com/agentic-eco/cli)
- [Issues](https://github.com/agentic-eco/cli/issues)
- [NPM](https://www.npmjs.com/package/@agentic-eco/cli)

## 💡 Support

For support:
- 📧 Email: support@agentic-eco.com
- 💬 Discord: [Join our community](https://discord.gg/agentic-eco)
- 📖 Docs: [docs.agentic-eco.com](https://docs.agentic-eco.com)
