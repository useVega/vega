/**
 * Test: Vega Advanced Features
 * Demonstrates schedule, ticks, and dialogue modes
 */

import { WorkflowYAMLParser } from './src/workflow/yaml-parser.service';
import { AgentScheduler, TickManager } from './src/execution/scheduler.service';
import { DialogueExecutor } from './src/execution/dialogue-executor.service';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testScheduleValidation() {
  console.log('\n=== Testing Schedule Validation ===\n');
  
  const scheduler = new AgentScheduler();
  
  // Valid schedule
  const validSchedule = {
    startTime: "09:00",
    endTime: "17:00",
    timezone: "Asia/Kolkata",
    daysOfWeek: [1, 2, 3, 4, 5]
  };
  
  const validation = scheduler.validateSchedule(validSchedule);
  console.log('Valid schedule:', validation.valid ? '✅' : '❌');
  
  // Invalid schedule
  const invalidSchedule = {
    startTime: "9:00",  // Missing leading zero
    endTime: "25:00",   // Invalid hour
    timezone: "Asia/Kolkata"
  };
  
  const invalidValidation = scheduler.validateSchedule(invalidSchedule);
  console.log('Invalid schedule detected:', !invalidValidation.valid ? '✅' : '❌');
  console.log('Errors:', invalidValidation.errors);
  
  // Check if within schedule
  const isWithin = scheduler.isWithinSchedule(validSchedule);
  console.log(`\nCurrent time is within schedule: ${isWithin ? '✅' : '❌'}`);
  
  if (!isWithin) {
    const waitMs = scheduler.getWaitTimeMs(validSchedule);
    const waitMinutes = Math.round(waitMs / 60000);
    console.log(`Wait time: ${waitMinutes} minutes`);
  }
}

async function testTickManager() {
  console.log('\n=== Testing Tick Manager ===\n');
  
  const tickManager = new TickManager();
  
  const tickConfig = {
    enabled: true,
    intervalSeconds: 5,
    intervalMs: 5000,
    maxTicksPerRound: 10
  };
  
  console.log('Testing tick execution:');
  
  for (let i = 0; i < 12; i++) {
    const canExecute = tickManager.shouldExecute('test-agent', tickConfig);
    console.log(`Tick ${i + 1}: ${canExecute ? '✅ Execute' : '❌ Skip'}`);
    
    if (canExecute) {
      tickManager.recordTick('test-agent');
      const count = tickManager.getTickCount('test-agent');
      console.log(`  -> Tick count: ${count}`);
      
      // Simulate wait
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\nResetting round...');
  tickManager.resetRound('test-agent');
  console.log('Tick count after reset:', tickManager.getTickCount('test-agent'));
}

async function testYAMLParser() {
  console.log('\n=== Testing YAML Parser with New Features ===\n');
  
  const parser = new WorkflowYAMLParser();
  
  // Test parsing natural dialogue workflow
  try {
    const yamlContent = readFileSync(
      join(__dirname, 'workflows/natural-executive-dialogue.yaml'),
      'utf-8'
    );
    
    const workflow = parser.parse(yamlContent, 'test-user');
    
    console.log('Workflow parsed successfully ✅');
    console.log('Workflow name:', workflow.name);
    console.log('Execution mode:', workflow.executionConfig?.mode);
    
    if (workflow.executionConfig?.schedule) {
      console.log('Schedule:');
      console.log('  Start time:', workflow.executionConfig.schedule.startTime);
      console.log('  End time:', workflow.executionConfig.schedule.endTime);
      console.log('  Timezone:', workflow.executionConfig.schedule.timezone);
      console.log('  Days:', workflow.executionConfig.schedule.daysOfWeek);
    }
    
    if (workflow.executionConfig?.tickConfig) {
      console.log('Ticks:');
      console.log('  Enabled:', workflow.executionConfig.tickConfig.enabled);
      console.log('  Interval (ms):', workflow.executionConfig.tickConfig.intervalMs);
      console.log('  Max per round:', workflow.executionConfig.tickConfig.maxTicksPerRound);
    }
    
    // Find dialogue node
    const dialogueNode = workflow.nodes.find(n => n.type === 'dialogue');
    if (dialogueNode && dialogueNode.dialogue) {
      console.log('\nDialogue Configuration:');
      console.log('  Mode:', dialogueNode.dialogue.mode);
      console.log('  Participants:', dialogueNode.dialogue.participants);
      console.log('  Max turns:', dialogueNode.dialogue.maxTurns);
      console.log('  Pre-defined turns:', dialogueNode.dialogue.turns.length);
    }
    
  } catch (error) {
    console.error('Error parsing workflow:', error);
  }
  
  // Test other workflow types
  const workflowFiles = [
    'scheduled-market-analysis.yaml',
    'round-robin-discussion.yaml',
    'tick-based-monitoring.yaml'
  ];
  
  console.log('\n=== Testing Other Workflow Types ===\n');
  
  for (const file of workflowFiles) {
    try {
      const yamlContent = readFileSync(
        join(__dirname, 'workflows', file),
        'utf-8'
      );
      
      const workflow = parser.parse(yamlContent, 'test-user');
      console.log(`✅ ${file}`);
      console.log(`   Mode: ${workflow.executionConfig?.mode || 'default'}`);
      console.log(`   Nodes: ${workflow.nodes.length}`);
    } catch (error) {
      console.log(`❌ ${file}: ${error}`);
    }
  }
}

async function testDialogueFormat() {
  console.log('\n=== Testing Dialogue Format ===\n');
  
  const mockTurns = [
    {
      turnId: '1',
      speaker: 'ceo-agent-v1',
      prompt: 'What is our market strategy?',
      response: 'We should focus on enterprise customers with strong product-market fit.',
      timestamp: new Date(),
      cost: '0.01'
    },
    {
      turnId: '2',
      speaker: 'cto-agent-v1',
      prompt: 'CEO perspective received',
      response: 'From a technical standpoint, we can build this in 6 months with our current stack.',
      timestamp: new Date(),
      cost: '0.01'
    },
    {
      turnId: '3',
      speaker: 'cmo-agent-v1',
      prompt: 'Strategic and technical input received',
      response: 'I recommend a phased marketing approach targeting Fortune 500 companies.',
      timestamp: new Date(),
      cost: '0.01'
    }
  ];
  
  console.log('Natural Conversation Output:\n');
  console.log('CEO: We should focus on enterprise customers with strong product-market fit.\n');
  console.log('CTO: From a technical standpoint, we can build this in 6 months with our current stack.\n');
  console.log('CMO: I recommend a phased marketing approach targeting Fortune 500 companies.\n');
  
  console.log('Summary:');
  console.log(`  Total turns: ${mockTurns.length}`);
  console.log(`  Total cost: $${mockTurns.reduce((sum, t) => sum + parseFloat(t.cost), 0).toFixed(2)}`);
  
  if (mockTurns.length > 0) {
    const firstTurn = mockTurns[0];
    const lastTurn = mockTurns[mockTurns.length - 1];
    if (firstTurn && lastTurn) {
      const duration = (lastTurn.timestamp.getTime() - firstTurn.timestamp.getTime()) / 1000;
      console.log(`  Duration: ${duration}s`);
    }
  }
}

async function demonstrateFeatures() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Vega Advanced Features Demonstration             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  await testScheduleValidation();
  await testTickManager();
  await testYAMLParser();
  await testDialogueFormat();
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   All Tests Completed                              ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  console.log('Next Steps:');
  console.log('1. Review the example workflows in /workflows');
  console.log('2. Read VEGA_ADVANCED_FEATURES.md for full documentation');
  console.log('3. Check VEGA_YAML_QUICK_REF.md for quick reference');
  console.log('4. Create your own workflows with schedules, ticks, and dialogues!');
}

// Run demonstration
demonstrateFeatures().catch(console.error);
