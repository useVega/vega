# Vega Advanced Features Guide

## Overview

Vega now supports advanced agent orchestration features including:
- **Schedule-based execution** - Agents operate during specific time windows
- **Tick-based execution** - Agents take actions at specific frequencies
- **Dialogue mode** - Natural conversation-style interactions between agents
- **Flexible YAML configuration** - Configure everything from YAML workflows

---

## 1. Schedule-Based Execution

Agents can be configured to operate only during specific time windows.

### Time Format
- **24-hour format**: Use `HH:MM` (e.g., `"09:00"`, `"17:30"`)
- Always specify hours and minutes with leading zeros

### Configuration

#### Workflow-Level Schedule
```yaml
execution:
  mode: scheduled
  schedule:
    startTime: "09:00"      # Agent operates from 9 AM
    endTime: "17:00"        # Until 5 PM
    timezone: "Asia/Kolkata"  # Timezone (default: UTC)
    daysOfWeek: [1, 2, 3, 4, 5]   # Monday-Friday (0=Sunday, 6=Saturday)
```

#### Node-Level Schedule (overrides workflow-level)
```yaml
nodes:
  - id: market_analyzer
    ref: analyzer-v1
    name: "Market Analyzer"
    schedule:
      startTime: "09:30"    # Specific hours for this agent
      endTime: "16:00"
      timezone: "Asia/Kolkata"
      daysOfWeek: [1, 2, 3, 4, 5]
    inputs:
      data: "{{input.data}}"
```

### Use Cases
- **Trading bots**: Operate only during market hours
- **Business agents**: Run during business hours in specific timezones
- **Compliance**: Ensure agents don't operate outside allowed windows
- **Cost optimization**: Reduce costs by limiting execution windows

---

## 2. Tick-Based Execution

Control the frequency at which agents take actions.

### Configuration

#### Workflow-Level Ticks
```yaml
execution:
  mode: ticks
  ticks:
    enabled: true
    intervalSeconds: 30        # Execute every 30 seconds
    # OR
    intervalMinutes: 5         # Execute every 5 minutes
    # OR
    intervalMs: 1000          # Execute every 1000ms (1 second)
    maxTicksPerRound: 100     # Maximum executions per round
```

#### Node-Level Ticks
```yaml
nodes:
  - id: health_checker
    ref: checker-v1
    name: "Health Monitor"
    ticks:
      enabled: true
      intervalSeconds: 10      # Check every 10 seconds
      maxTicksPerRound: 360    # Max 360 checks per round (1 hour)
    inputs:
      url: "{{input.serviceUrl}}"
```

### Convenience Formats
- `intervalMs`: Milliseconds (precise control)
- `intervalSeconds`: Seconds (common use case)
- `intervalMinutes`: Minutes (less frequent checks)

### Use Cases
- **Monitoring**: Check system health at regular intervals
- **Data collection**: Fetch data periodically
- **Rate limiting**: Control API call frequency
- **Resource management**: Prevent overwhelming external services

---

## 3. Dialogue Mode

Enable natural conversation-style interactions between agents.

### Dialogue Modes

#### Sequential Mode
Agents follow pre-defined conversation turns:
```yaml
nodes:
  - id: discussion
    type: dialogue
    name: "Structured Discussion"
    dialogue:
      mode: sequential
      participants:
        - ceo-agent-v1
        - cto-agent-v1
        - cmo-agent-v1
      maxTurns: 10
      turns:
        - speaker: ceo-agent-v1
          prompt: "What's your strategic view on {{inputs.topic}}?"
        
        - speaker: cto-agent-v1
          prompt: |
            CEO said: {{conversationHistory[-1]}}
            What are the technical implications?
          respondTo: [0]  # Responds to first turn
        
        - speaker: cmo-agent-v1
          prompt: |
            Based on:
            {{conversationHistory[-2]}}
            {{conversationHistory[-1]}}
            How should we market this?
          respondTo: [0, 1]  # Responds to first two turns
```

#### Round-Robin Mode
Agents take turns automatically:
```yaml
dialogue:
  mode: round-robin
  participants:
    - ceo-agent-v1
    - cto-agent-v1
    - cmo-agent-v1
  maxTurns: 15
  turns: []  # Dynamically generated
```

#### Dynamic Mode
Agents decide when to speak based on context:
```yaml
dialogue:
  mode: dynamic
  participants:
    - ceo-agent-v1
    - cto-agent-v1
    - cmo-agent-v1
  maxTurns: 20
  endCondition: "{{turnCount >= 20}}"
```

### Template Variables in Dialogues

Access conversation context:
- `{{conversationHistory}}` - Full conversation array
- `{{conversationHistory[-1]}}` - Last message
- `{{previousTurns}}` - Array of turn objects
- `{{previousTurns[-1].response}}` - Last turn's response
- `{{turnCount}}` - Current turn count

### Use Cases
- **Team brainstorming**: Natural back-and-forth discussions
- **Complex decision-making**: Multi-perspective analysis
- **Debate scenarios**: Agents presenting different viewpoints
- **Customer service**: Multi-agent handling of complex queries

---

## 4. Combined Features

Combine scheduling, ticks, and dialogue for powerful workflows:

```yaml
name: "Smart Executive Discussion"
version: "1.0.0"
chain: "base"
token: "USDC"
maxBudget: "10.0"

# Workflow operates during business hours
execution:
  mode: dialogue
  schedule:
    startTime: "09:00"
    endTime: "17:00"
    timezone: "Asia/Kolkata"
    daysOfWeek: [1, 2, 3, 4, 5]
  ticks:
    enabled: true
    intervalSeconds: 30     # Agents can respond every 30s
    maxTicksPerRound: 10

nodes:
  - id: discussion
    type: dialogue
    name: "Executive Discussion"
    
    # Node-specific overrides
    schedule:
      startTime: "10:00"    # More restrictive hours
      endTime: "16:00"
    
    ticks:
      enabled: true
      intervalSeconds: 45    # Slower response time
      maxTicksPerRound: 8
    
    dialogue:
      mode: dynamic
      participants:
        - ceo-agent-v1
        - cto-agent-v1
        - cmo-agent-v1
      maxTurns: 15
```

---

## 5. Migration from Rounds

### Old Way (Rounds)
```yaml
inputs:
  rounds:
    type: number
    default: 3
```

### New Way (Execution Config)
```yaml
execution:
  mode: rounds          # Still supported
  rounds: 3

  # OR use ticks
  mode: ticks
  ticks:
    enabled: true
    maxTicksPerRound: 3

  # OR use dialogue
  mode: dialogue
  # ... dialogue config
```

---

## 6. Complete Examples

### Example 1: Business Hours Trading Bot
```yaml
name: "Trading Bot"
execution:
  mode: scheduled
  schedule:
    startTime: "09:30"
    endTime: "16:00"
    timezone: "America/New_York"
    daysOfWeek: [1, 2, 3, 4, 5]
  ticks:
    enabled: true
    intervalMinutes: 5
    maxTicksPerRound: 78  # 6.5 hours * 12

nodes:
  - id: analyze
    ref: market-analyzer-v1
    ticks:
      intervalMinutes: 1  # More frequent for this node
```

### Example 2: 24/7 Monitoring
```yaml
name: "System Monitor"
execution:
  mode: ticks
  ticks:
    enabled: true
    intervalSeconds: 30
    # No schedule = runs 24/7

nodes:
  - id: check_health
    ref: health-checker-v1
    ticks:
      intervalSeconds: 10  # Fast checks
```

### Example 3: Natural Team Discussion
```yaml
name: "Product Planning"
execution:
  mode: dialogue

nodes:
  - id: discussion
    type: dialogue
    dialogue:
      mode: sequential
      participants:
        - product-manager-v1
        - designer-v1
        - engineer-v1
      turns:
        - speaker: product-manager-v1
          prompt: "Here's the feature request: {{inputs.feature}}"
        - speaker: designer-v1
          prompt: "From a UX perspective: {{conversationHistory[-1]}}"
        - speaker: engineer-v1
          prompt: "Technical feasibility: {{conversationHistory}}"
```

---

## 7. Best Practices

### Scheduling
- ✅ Use appropriate timezones for your use case
- ✅ Consider holidays and special events
- ✅ Set realistic time windows
- ❌ Don't make windows too narrow (agents may never execute)

### Ticks
- ✅ Match interval to use case (monitoring = seconds, analysis = minutes)
- ✅ Set reasonable maxTicksPerRound to control costs
- ✅ Use different intervals for different nodes
- ❌ Don't set intervals too low (avoid overwhelming APIs)

### Dialogue
- ✅ Design conversation flows logically
- ✅ Use respondTo to create context
- ✅ Set appropriate maxTurns
- ✅ Consider using endCondition for dynamic termination
- ❌ Don't create circular conversation loops

### Cost Management
```yaml
# Control costs with tick limits
ticks:
  enabled: true
  intervalMinutes: 5
  maxTicksPerRound: 12  # Max 1 hour of 5-min intervals

# Limit dialogue length
dialogue:
  maxTurns: 10
  endCondition: "{{turnCount >= 10}}"
```

---

## 8. Validation

The system validates your configuration:

### Schedule Validation
- Time format must be `HH:MM` (24-hour)
- Start time must be before end time
- Days of week must be 0-6
- Timezone must be valid

### Tick Validation
- At least one interval must be specified
- Intervals must be positive
- maxTicksPerRound must be positive

### Dialogue Validation
- Participants must be valid agent refs
- Turns must reference valid speakers
- Mode must be: sequential, round-robin, or dynamic

---

## 9. API Usage

### Checking Agent Availability
```typescript
import { AgentScheduler } from './execution/scheduler.service';

const scheduler = new AgentScheduler();

// Check if agent can run now
const canRun = scheduler.isWithinSchedule({
  startTime: "09:00",
  endTime: "17:00",
  timezone: "Asia/Kolkata",
  daysOfWeek: [1, 2, 3, 4, 5]
});

// Get wait time
const waitMs = scheduler.getWaitTimeMs(schedule);
```

### Managing Ticks
```typescript
import { TickManager } from './execution/scheduler.service';

const tickManager = new TickManager();

// Check if agent should execute
if (tickManager.shouldExecute('agent-1', tickConfig)) {
  // Execute agent
  await executeAgent();
  tickManager.recordTick('agent-1');
}

// Get tick count
const count = tickManager.getTickCount('agent-1');
```

### Executing Dialogues
```typescript
import { DialogueExecutor } from './execution/dialogue-executor.service';

const dialogueExecutor = new DialogueExecutor(registry, caller);

const result = await dialogueExecutor.executeDialogue(
  dialogueNode,
  workflowContext,
  runId
);

console.log(result.output.conversationHistory);
```

---

## 10. Troubleshooting

### Agent Not Executing
- Check schedule: Is current time within allowed window?
- Check days: Is today an allowed day?
- Check ticks: Has minimum interval elapsed?
- Check maxTicks: Have you hit the limit?

### Dialogue Not Flowing
- Verify participant agent refs exist
- Check template variables are resolving
- Ensure respondTo indices are valid
- Check maxTurns hasn't been reached

### Unexpected Costs
- Review maxTicksPerRound settings
- Check interval frequencies
- Set maxTurns for dialogues
- Use cost estimates before execution

---

## Support

For questions or issues:
1. Check workflow validation errors
2. Review agent logs
3. Verify agent definitions
4. Test with simple configurations first

Happy orchestrating! 🚀
