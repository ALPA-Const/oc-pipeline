/**
 * AutoGPT Service
 * Service layer for autonomous agent operations
 */

import {
  Agent,
  AgentAction,
  AgentGoal,
  AgentMemory,
  AgentStats,
  AgentStatus,
  AgentThought,
  AutoGPTSession,
  SessionConfig,
  Task,
  TaskStatus,
  Tool,
  ToolType,
  AgentMetrics,
} from '@/types/autogpt.types';

// Mock delay for simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AutoGPTService {
  private sessions: Map<string, AutoGPTSession> = new Map();
  private agents: Map<string, Agent> = new Map();

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(
    name: string,
    goals: string[],
    config?: Partial<SessionConfig>
  ): Promise<AutoGPTSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const defaultConfig: SessionConfig = {
      max_iterations: 100,
      max_tokens: 10000,
      temperature: 0.7,
      auto_continue: false,
      require_approval: true,
      timeout_seconds: 300,
      allowed_tools: ['web-search', 'api-call', 'calculation', 'analysis'],
      ...config,
    };

    const agent: Agent = {
      id: agentId,
      name: `Agent-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      type: 'autonomous',
      status: 'idle',
      thoughts: [],
      actions: [],
      memory: [],
      tools: this.initializeTools(defaultConfig.allowed_tools),
      created_at: new Date(),
      updated_at: new Date(),
      stats: {
        tasks_completed: 0,
        tasks_failed: 0,
        total_execution_time: 0,
        tools_used: {},
        success_rate: 0,
        average_task_duration: 0,
        tokens_used: 0,
        cost: 0,
      },
    };

    const agentGoals: AgentGoal[] = goals.map((goal, index) => ({
      id: `goal_${index}_${Date.now()}`,
      description: goal,
      success_criteria: [],
      constraints: [],
      created_at: new Date(),
      status: 'active',
    }));

    const session: AutoGPTSession = {
      id: sessionId,
      name,
      agent,
      goals: agentGoals,
      tasks: [],
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      config: defaultConfig,
    };

    this.sessions.set(sessionId, session);
    this.agents.set(agentId, agent);

    return session;
  }

  async getSession(sessionId: string): Promise<AutoGPTSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getAllSessions(): Promise<AutoGPTSession[]> {
    return Array.from(this.sessions.values());
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.agent.status = 'paused';
      session.updated_at = new Date();
    }
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'active';
      session.agent.status = 'planning';
      session.updated_at = new Date();
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.agents.delete(session.agent.id);
      this.sessions.delete(sessionId);
    }
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  async runAgent(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return;
    }

    const agent = session.agent;
    agent.status = 'planning';

    // Simulate agent thinking process
    await this.think(agent, 'Analyzing goals and breaking down into tasks...');
    await delay(1000);

    // Create tasks from goals
    if (session.tasks.length === 0) {
      await this.decomposeTasks(session);
    }

    // Execute tasks
    for (const task of session.tasks) {
      if (task.status === 'pending') {
        await this.executeTask(session, task);
      }
    }

    agent.status = 'completed';
    session.status = 'completed';
    session.completed_at = new Date();
  }

  private async decomposeTasks(session: AutoGPTSession): Promise<void> {
    const agent = session.agent;

    for (const goal of session.goals) {
      if (goal.status !== 'active') continue;

      await this.think(
        agent,
        `Breaking down goal: "${goal.description}" into actionable tasks...`
      );

      // Simulate task decomposition
      const tasks: Task[] = [
        {
          id: `task_${Date.now()}_1`,
          title: `Research and gather information for: ${goal.description}`,
          description: 'Collect relevant data and context',
          priority: 'high',
          status: 'pending',
          subtasks: [],
          created_at: new Date(),
          updated_at: new Date(),
          progress: 0,
          estimated_duration: 30,
        },
        {
          id: `task_${Date.now()}_2`,
          title: `Analyze and process data for: ${goal.description}`,
          description: 'Process collected information and identify patterns',
          priority: 'high',
          status: 'pending',
          subtasks: [],
          created_at: new Date(),
          updated_at: new Date(),
          progress: 0,
          estimated_duration: 45,
        },
        {
          id: `task_${Date.now()}_3`,
          title: `Execute solution for: ${goal.description}`,
          description: 'Implement the planned solution',
          priority: 'medium',
          status: 'pending',
          subtasks: [],
          created_at: new Date(),
          updated_at: new Date(),
          progress: 0,
          estimated_duration: 60,
        },
      ];

      session.tasks.push(...tasks);
    }
  }

  private async executeTask(session: AutoGPTSession, task: Task): Promise<void> {
    const agent = session.agent;
    agent.status = 'executing';
    agent.current_task = task;
    task.status = 'in-progress';

    await this.think(agent, `Starting task: ${task.title}`);

    // Simulate task execution with multiple steps
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await delay(500);
      task.progress = (i / steps) * 100;
      
      if (i === 3) {
        // Simulate using a tool
        await this.executeAction(agent, 'analysis', {
          data: `Processing ${task.title}`,
        });
      }
    }

    // Complete task
    task.status = 'completed';
    task.completed_at = new Date();
    task.progress = 100;

    agent.stats.tasks_completed++;
    agent.stats.success_rate = 
      agent.stats.tasks_completed / 
      (agent.stats.tasks_completed + agent.stats.tasks_failed);

    await this.think(agent, `Completed task: ${task.title}`);
  }

  private async think(
    agent: Agent,
    content: string,
    type: AgentThought['type'] = 'reasoning'
  ): Promise<void> {
    const thought: AgentThought = {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      type,
      content,
      confidence: 0.7 + Math.random() * 0.3,
    };

    agent.thoughts.push(thought);
    
    // Keep only last 50 thoughts
    if (agent.thoughts.length > 50) {
      agent.thoughts = agent.thoughts.slice(-50);
    }

    // Store in memory
    this.addMemory(agent, {
      id: `mem_${Date.now()}`,
      type: 'short-term',
      content,
      importance: 0.5,
      timestamp: new Date(),
      expires_at: new Date(Date.now() + 3600000), // 1 hour
    });
  }

  private async executeAction(
    agent: Agent,
    tool: string,
    input: any
  ): Promise<AgentAction> {
    const startTime = Date.now();
    agent.status = 'executing';

    const action: AgentAction = {
      id: `action_${Date.now()}`,
      timestamp: new Date(),
      tool,
      input,
      status: 'executing',
    };

    agent.actions.push(action);

    // Simulate tool execution
    await delay(800 + Math.random() * 1200);

    const duration = Date.now() - startTime;
    action.duration_ms = duration;
    action.status = 'completed';
    action.output = {
      success: true,
      result: `Executed ${tool} successfully`,
    };

    // Update stats
    agent.stats.tools_used[tool] = (agent.stats.tools_used[tool] || 0) + 1;
    agent.stats.total_execution_time += duration;

    const toolObj = agent.tools.find(t => t.name === tool);
    if (toolObj) {
      toolObj.usage_count++;
    }

    return action;
  }

  private addMemory(agent: Agent, memory: AgentMemory): void {
    agent.memory.push(memory);
    
    // Keep only last 100 memories
    if (agent.memory.length > 100) {
      agent.memory = agent.memory.slice(-100);
    }
  }

  // ============================================================================
  // TOOLS
  // ============================================================================

  private initializeTools(allowedTools: ToolType[]): Tool[] {
    const allTools: Tool[] = [
      {
        id: 'web-search',
        name: 'web-search',
        type: 'web-search',
        description: 'Search the web for information',
        enabled: allowedTools.includes('web-search'),
        usage_count: 0,
      },
      {
        id: 'file-read',
        name: 'file-read',
        type: 'file-read',
        description: 'Read files from the system',
        enabled: allowedTools.includes('file-read'),
        usage_count: 0,
      },
      {
        id: 'file-write',
        name: 'file-write',
        type: 'file-write',
        description: 'Write files to the system',
        enabled: allowedTools.includes('file-write'),
        usage_count: 0,
      },
      {
        id: 'api-call',
        name: 'api-call',
        type: 'api-call',
        description: 'Make API calls to external services',
        enabled: allowedTools.includes('api-call'),
        usage_count: 0,
      },
      {
        id: 'calculation',
        name: 'calculation',
        type: 'calculation',
        description: 'Perform mathematical calculations',
        enabled: allowedTools.includes('calculation'),
        usage_count: 0,
      },
      {
        id: 'code-execution',
        name: 'code-execution',
        type: 'code-execution',
        description: 'Execute code in a sandboxed environment',
        enabled: allowedTools.includes('code-execution'),
        usage_count: 0,
      },
      {
        id: 'database-query',
        name: 'database-query',
        type: 'database-query',
        description: 'Query the database',
        enabled: allowedTools.includes('database-query'),
        usage_count: 0,
      },
      {
        id: 'analysis',
        name: 'analysis',
        type: 'analysis',
        description: 'Perform data analysis',
        enabled: allowedTools.includes('analysis'),
        usage_count: 0,
      },
    ];

    return allTools.filter(tool => tool.enabled);
  }

  // ============================================================================
  // METRICS
  // ============================================================================

  async getMetrics(): Promise<AgentMetrics> {
    const sessions = Array.from(this.sessions.values());
    const agents = Array.from(this.agents.values());

    const activeSessions = sessions.filter(s => s.status === 'active');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    const totalTasks = sessions.flatMap(s => s.tasks);
    const pendingTasks = totalTasks.filter(t => t.status === 'pending');
    const completedTasks = totalTasks.filter(t => t.status === 'completed');

    const avgCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.actual_duration || 0), 0) / completedTasks.length
        : 0;

    const successRate =
      totalTasks.length > 0
        ? completedTasks.length / totalTasks.length
        : 0;

    const totalCost = agents.reduce((sum, a) => sum + (a.stats.cost || 0), 0);
    const tokensUsed = agents.reduce((sum, a) => sum + (a.stats.tokens_used || 0), 0);

    return {
      total_sessions: sessions.length,
      active_agents: activeSessions.length,
      tasks_in_queue: pendingTasks.length,
      avg_completion_time: avgCompletionTime,
      success_rate: successRate,
      total_cost: totalCost,
      tokens_used_today: tokensUsed,
      cost_today: totalCost,
    };
  }
}

export const autoGPTService = new AutoGPTService();
