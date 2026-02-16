/**
 * React Example Components
 * Real-world examples of using the frontend abstraction in React
 */

import React, { useState, useEffect } from 'react';
import { AgenticClient, type ExecutionProgress, type AgentInfo } from '../src/frontend';

// Initialize client (would typically be in a context provider)
const client = new AgenticClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  defaultChain: 'base',
  defaultToken: 'USDC',
});

// =============================================================================
// 1. Workflow Executor Component
// =============================================================================

interface WorkflowExecutorProps {
  userId: string;
  userWallet: string;
}

export function WorkflowExecutor({ userId, userWallet }: WorkflowExecutorProps) {
  const [yaml, setYaml] = useState('');
  const [inputs, setInputs] = useState('{}');
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Execute workflow
  const handleExecute = async () => {
    setError(null);
    
    try {
      const parsedInputs = JSON.parse(inputs);
      
      const result = await client.workflows.execute({
        yaml,
        userId,
        userWallet,
        inputs: parsedInputs,
      });

      if (result.success) {
        setRunId(result.runId!);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid inputs');
    }
  };

  // Poll for progress
  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      const prog = await client.workflows.getProgress(runId);
      setProgress(prog);

      if (prog?.status === 'completed' || prog?.status === 'failed') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [runId]);

  // Cancel workflow
  const handleCancel = async () => {
    if (runId) {
      await client.workflows.cancel(runId);
      setRunId(null);
      setProgress(null);
    }
  };

  return (
    <div className="workflow-executor">
      <h2>Workflow Executor</h2>

      <div className="form-group">
        <label>Workflow YAML:</label>
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          rows={10}
          placeholder="Enter workflow YAML..."
        />
      </div>

      <div className="form-group">
        <label>Inputs (JSON):</label>
        <textarea
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          rows={3}
          placeholder='{"param1": "value1"}'
        />
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="actions">
        <button onClick={handleExecute} disabled={!!runId}>
          Execute Workflow
        </button>
        {runId && progress?.status === 'running' && (
          <button onClick={handleCancel}>Cancel</button>
        )}
      </div>

      {progress && (
        <div className="progress-panel">
          <h3>Execution Progress</h3>
          <div className="status">
            Status: <span className={`badge ${progress.status}`}>{progress.status}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(progress.completedNodes.length / progress.totalNodes) * 100}%`,
              }}
            />
          </div>
          <div className="progress-text">
            {progress.completedNodes.length} / {progress.totalNodes} nodes completed
          </div>
          {progress.currentNode && (
            <div className="current-node">
              Current: {progress.currentNode}
            </div>
          )}
          {progress.outputs && (
            <div className="outputs">
              <h4>Outputs:</h4>
              <pre>{JSON.stringify(progress.outputs, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 2. Agent Browser Component
// =============================================================================

export function AgentBrowser() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    maxPrice: '',
  });

  // Search agents
  const searchAgents = async () => {
    setLoading(true);
    const result = await client.agents.search({
      category: filters.category || undefined,
      search: filters.search || undefined,
      maxPrice: filters.maxPrice || undefined,
      status: 'active',
    });
    setAgents(result.agents);
    setLoading(false);
  };

  useEffect(() => {
    searchAgents();
  }, []);

  return (
    <div className="agent-browser">
      <h2>Agent Marketplace</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search agents..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="ai-ml">AI/ML</option>
          <option value="data-processing">Data Processing</option>
          <option value="web-scraping">Web Scraping</option>
          <option value="blockchain">Blockchain</option>
        </select>

        <input
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
        />

        <button onClick={searchAgents}>Search</button>
      </div>

      {loading ? (
        <div className="loading">Loading agents...</div>
      ) : (
        <div className="agent-grid">
          {agents.map((agent) => (
            <AgentCard key={agent.ref} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 3. Agent Card Component
// =============================================================================

interface AgentCardProps {
  agent: AgentInfo;
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="agent-card">
      <div className="agent-header">
        <h3>{agent.name}</h3>
        <span className={`status-badge ${agent.status}`}>{agent.status}</span>
      </div>
      
      <p className="description">{agent.description}</p>
      
      <div className="agent-meta">
        <div className="category">{agent.category}</div>
        <div className="version">v{agent.version}</div>
      </div>

      <div className="pricing">
        <span className="price">{agent.pricing.amount} {agent.pricing.token}</span>
        <span className="per">{agent.pricing.type}</span>
      </div>

      <div className="tags">
        {agent.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {agent.stats && (
        <div className="stats">
          <div>Calls: {agent.stats.totalCalls || 0}</div>
          <div>Success: {agent.stats.successRate || 100}%</div>
        </div>
      )}

      <button className="use-agent">Use Agent</button>
    </div>
  );
}

// =============================================================================
// 4. Budget Dashboard Component
// =============================================================================

interface BudgetDashboardProps {
  userId: string;
  userWallet: string;
}

export function BudgetDashboard({ userId, userWallet }: BudgetDashboardProps) {
  const [budgetInfo, setBudgetInfo] = useState<any>(null);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Load budget info
  const loadBudget = async () => {
    const info = await client.payments.getBudgetInfo(userId, userWallet);
    setBudgetInfo(info);
  };

  useEffect(() => {
    loadBudget();
    const interval = setInterval(loadBudget, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Add funds
  const handleAddFunds = async () => {
    setLoading(true);
    const result = await client.payments.addFunds(userId, addAmount, 'USDC');
    if (result.success) {
      await loadBudget();
      setAddAmount('');
    }
    setLoading(false);
  };

  if (!budgetInfo) return <div>Loading...</div>;

  return (
    <div className="budget-dashboard">
      <h2>Budget Dashboard</h2>

      <div className="budget-summary">
        <div className="budget-card">
          <h3>Available</h3>
          <div className="amount">{budgetInfo.available} USDC</div>
        </div>

        <div className="budget-card">
          <h3>Reserved</h3>
          <div className="amount">{budgetInfo.reserved} USDC</div>
        </div>

        <div className="budget-card">
          <h3>Spent</h3>
          <div className="amount">{budgetInfo.spent} USDC</div>
        </div>
      </div>

      <div className="add-funds">
        <h3>Add Funds</h3>
        <div className="form-inline">
          <input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Amount"
          />
          <button onClick={handleAddFunds} disabled={loading}>
            {loading ? 'Adding...' : 'Add Funds'}
          </button>
        </div>
      </div>

      <div className="reservations">
        <h3>Active Reservations</h3>
        {budgetInfo.reservations.length === 0 ? (
          <p>No active reservations</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Amount</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {budgetInfo.reservations.map((res: any) => (
                <tr key={res.runId}>
                  <td>{res.runId.slice(0, 8)}...</td>
                  <td>{res.amount} USDC</td>
                  <td>{new Date(res.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 5. Workflow Template Builder Component
// =============================================================================

export function WorkflowTemplateBuilder() {
  const [template, setTemplate] = useState('');

  const generateTemplate = () => {
    const generated = client.workflows.generateTemplate();
    setTemplate(generated);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template);
  };

  return (
    <div className="template-builder">
      <h2>Workflow Template Builder</h2>

      <button onClick={generateTemplate}>Generate Template</button>

      {template && (
        <div className="template-output">
          <div className="toolbar">
            <button onClick={copyToClipboard}>Copy to Clipboard</button>
          </div>
          <pre>{template}</pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 6. System Health Component
// =============================================================================

export function SystemHealth() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const h = await client.healthCheck();
      setHealth(h);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return <div>Checking system health...</div>;

  return (
    <div className="system-health">
      <h2>System Health</h2>

      <div className={`status-badge ${health.status}`}>
        {health.status.toUpperCase()}
      </div>

      <div className="services">
        <h3>Services</h3>
        <div className="service-list">
          <div className="service">
            Registry: {health.services.registry ? '✓' : '✗'}
          </div>
          <div className="service">
            Execution: {health.services.execution ? '✓' : '✗'}
          </div>
          <div className="service">
            Payment: {health.services.payment ? '✓' : '✗'}
          </div>
        </div>
      </div>

      <div className="timestamp">
        Last checked: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
