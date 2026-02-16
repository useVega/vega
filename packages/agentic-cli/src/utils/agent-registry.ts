import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface AgentDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  endpoint?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  tags?: string[];
  pricing?: {
    model: string;
    basePrice: string;
  };
}

export class AgentRegistry {
  private registryPath: string;

  constructor() {
    // Store registry in user's home directory
    const agenticDir = join(homedir(), '.agentic');
    if (!existsSync(agenticDir)) {
      mkdirSync(agenticDir, { recursive: true });
    }
    this.registryPath = join(agenticDir, 'agents.json');
    
    // Initialize registry file if it doesn't exist
    if (!existsSync(this.registryPath)) {
      this.saveRegistry({});
    }
  }

  private loadRegistry(): Record<string, AgentDefinition> {
    try {
      const content = readFileSync(this.registryPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private saveRegistry(registry: Record<string, AgentDefinition>): void {
    writeFileSync(this.registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  }

  async register(agent: AgentDefinition): Promise<void> {
    const registry = this.loadRegistry();
    registry[agent.id] = agent;
    this.saveRegistry(registry);
  }

  async exists(id: string): Promise<boolean> {
    const registry = this.loadRegistry();
    return id in registry;
  }

  async get(id: string): Promise<AgentDefinition | undefined> {
    const registry = this.loadRegistry();
    return registry[id];
  }

  async listAll(): Promise<AgentDefinition[]> {
    const registry = this.loadRegistry();
    return Object.values(registry);
  }

  async remove(id: string): Promise<boolean> {
    const registry = this.loadRegistry();
    if (id in registry) {
      delete registry[id];
      this.saveRegistry(registry);
      return true;
    }
    return false;
  }
}
