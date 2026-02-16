# Vega YAML Quick Reference

## Schedule Configuration

```yaml
schedule:
  startTime: "09:00"              # 24-hour format HH:MM
  endTime: "17:00"                # 24-hour format HH:MM
  timezone: "Asia/Kolkata"    # IANA timezone
  daysOfWeek: [1, 2, 3, 4, 5]    # 0=Sun, 1=Mon ... 6=Sat
```

## Tick Configuration

```yaml
ticks:
  enabled: true
  intervalSeconds: 30        # Choose ONE interval format
  # intervalMinutes: 5       # OR this
  # intervalMs: 1000         # OR this
  maxTicksPerRound: 100      # Optional: limit executions
```

## Execution Modes

```yaml
execution:
  mode: rounds              # Legacy rounds-based
  rounds: 3
  
  # OR
  
  mode: ticks              # Frequency-based
  ticks: { ... }
  
  # OR
  
  mode: scheduled          # Time-based
  schedule: { ... }
  ticks: { ... }
  
  # OR
  
  mode: dialogue           # Conversation-based
  schedule: { ... }        # Optional
  ticks: { ... }           # Optional
```

## Dialogue Modes

### Sequential (Pre-defined turns)
```yaml
dialogue:
  mode: sequential
  participants:
    - agent-1
    - agent-2
  maxTurns: 10
  turns:
    - speaker: agent-1
      prompt: "Your question"
    - speaker: agent-2
      prompt: "Response to: {{conversationHistory[-1]}}"
      respondTo: [0]
```

### Round-Robin (Auto turns)
```yaml
dialogue:
  mode: round-robin
  participants:
    - agent-1
    - agent-2
    - agent-3
  maxTurns: 15
  turns: []  # Auto-generated
```

### Dynamic (Context-based)
```yaml
dialogue:
  mode: dynamic
  participants:
    - agent-1
    - agent-2
  maxTurns: 20
  endCondition: "{{turnCount >= 20}}"
```

## Template Variables

### In Dialogues
- `{{conversationHistory}}` - Full history array
- `{{conversationHistory[-1]}}` - Last message
- `{{conversationHistory[-2]}}` - Second to last
- `{{previousTurns}}` - Turn objects array
- `{{previousTurns[-1].response}}` - Last response
- `{{turnCount}}` - Current turn count

### In Inputs
- `{{inputs.fieldName}}` - Workflow input
- `{{nodeId.output}}` - Previous node output
- `{{nodeId.output.field}}` - Specific field

## Complete Workflow Template

```yaml
name: "My Workflow"
version: "1.0.0"
description: "Workflow description"
chain: "base"
token: "USDC"
maxBudget: "5.0"

tags:
  - tag1
  - tag2

# Workflow-level execution config
execution:
  mode: dialogue
  schedule:
    startTime: "09:00"
    endTime: "17:00"
    timezone: "UTC"
    daysOfWeek: [1, 2, 3, 4, 5]
  ticks:
    enabled: true
    intervalSeconds: 30
    maxTicksPerRound: 10

inputs:
  myInput:
    type: string
    description: "Input description"
    required: true
    default: "default value"

outputs:
  myOutput:
    type: object
    description: "Output description"
    value: "{{finalNode.output}}"

nodes:
  # Regular agent node
  - id: node1
    ref: agent-v1
    name: "Node Name"
    description: "Node description"
    
    # Node-level overrides (optional)
    schedule:
      startTime: "10:00"
      endTime: "16:00"
    
    ticks:
      enabled: true
      intervalMinutes: 5
    
    inputs:
      field1: "{{inputs.myInput}}"
      field2: "value"
  
  # Dialogue node
  - id: discussion
    type: dialogue
    name: "Discussion"
    
    dialogue:
      mode: sequential
      participants:
        - agent-1
        - agent-2
      maxTurns: 10
      turns:
        - speaker: agent-1
          prompt: "Question"
        - speaker: agent-2
          prompt: "Response"
    
    inputs:
      topic: "{{inputs.myInput}}"

edges:
  - from: node1
    to: discussion
  - from: discussion
    to: output
```

## Common Patterns

### Business Hours Only
```yaml
execution:
  mode: scheduled
  schedule:
    startTime: "09:00"
    endTime: "17:00"
    timezone: "Asia/Kolkata"
    daysOfWeek: [1, 2, 3, 4, 5]
```

### 24/7 Monitoring
```yaml
execution:
  mode: ticks
  ticks:
    enabled: true
    intervalSeconds: 30
  # No schedule = runs anytime
```

### Rate Limited
```yaml
execution:
  mode: ticks
  ticks:
    enabled: true
    intervalMinutes: 5
    maxTicksPerRound: 12  # 1 hour max
```

### Natural Conversation
```yaml
execution:
  mode: dialogue

nodes:
  - id: chat
    type: dialogue
    dialogue:
      mode: dynamic
      participants: [agent-1, agent-2, agent-3]
      maxTurns: 20
```

## Time Format Examples

✅ Valid:
- `"09:00"` - 9 AM
- `"17:30"` - 5:30 PM
- `"00:00"` - Midnight
- `"23:59"` - 11:59 PM

❌ Invalid:
- `"9:00"` - Missing leading zero
- `"25:00"` - Invalid hour
- `"12:60"` - Invalid minute
- `"9am"` - Not 24-hour format

## Interval Examples

```yaml
# Very frequent (monitoring)
intervalSeconds: 10

# Frequent (health checks)
intervalSeconds: 30

# Moderate (data collection)
intervalMinutes: 5

# Infrequent (reports)
intervalMinutes: 60

# Precise control
intervalMs: 2500  # 2.5 seconds
```

## Validation Checks

Before deployment, verify:
- [ ] Time format is HH:MM
- [ ] Start time < End time
- [ ] Days are 0-6
- [ ] Timezone is valid IANA name
- [ ] At least one interval specified if ticks enabled
- [ ] maxTicksPerRound is reasonable
- [ ] Agent refs exist
- [ ] Template variables resolve
- [ ] maxBudget is sufficient
