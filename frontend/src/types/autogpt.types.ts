/**
 * AutoGPT Types
 * Type definitions for the autonomous agent system
 */

export type AgentStatus = 
  | 'idle'
  | 'planning'
  | 'executing'
  | 'thinking'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'paused';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export type ToolType = 
  | 'web-search'
  | 'file-read'
  | 'file-write'
  | 'api-call'
  | 'calculation'
  | 'code-execution'
  | 'database-query'
  | 'analysis';

export interface Tool {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  enabled: boolean;
  usage_count: number;
}

export interface AgentThought {
  id: string;
  timestamp: Date;
  type: 'reasoning' | 'planning' | 'observation' | 'decision';
  content: string;
  confidence: number; // 0-1
}

export interface AgentAction {
  id: string;
  timestamp: Date;
  tool: string;
  input: any;
  output?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  duration_ms?: number;
  error?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  parent_id?: string;
  subtasks: Task[];
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  progress: number; // 0-100
  estimated_duration?: number; // in seconds
  actual_duration?: number;
  assigned_agent?: string;
}

export interface AgentGoal {
  id: string;
  description: string;
  success_criteria: string[];
  constraints: string[];
  created_at: Date;
  completed_at?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
}

export interface AgentMemory {
  id: string;
  type: 'short-term' | 'long-term' | 'episodic' | 'semantic';
  content: string;
  importance: number; // 0-1
  timestamp: Date;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  type: 'autonomous' | 'task-specific' | 'coordinator';
  status: AgentStatus;
  current_goal?: AgentGoal;
  current_task?: Task;
  thoughts: AgentThought[];
  actions: AgentAction[];
  memory: AgentMemory[];
  tools: Tool[];
  created_at: Date;
  updated_at: Date;
  stats: AgentStats;
}

export interface AgentStats {
  tasks_completed: number;
  tasks_failed: number;
  total_execution_time: number; // in ms
  tools_used: Record<string, number>;
  success_rate: number; // 0-1
  average_task_duration: number; // in ms
  tokens_used?: number;
  cost?: number; // in USD
}

export interface AutoGPTSession {
  id: string;
  name: string;
  agent: Agent;
  goals: AgentGoal[];
  tasks: Task[];
  status: 'active' | 'paused' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  config: SessionConfig;
}

export interface SessionConfig {
  max_iterations: number;
  max_tokens: number;
  temperature: number;
  auto_continue: boolean;
  require_approval: boolean;
  timeout_seconds: number;
  allowed_tools: ToolType[];
}

export interface AgentMetrics {
  total_sessions: number;
  active_agents: number;
  tasks_in_queue: number;
  avg_completion_time: number;
  success_rate: number;
  total_cost: number;
  tokens_used_today: number;
  cost_today: number;
}

export interface ThoughtProcess {
  step: number;
  type: 'analysis' | 'planning' | 'execution' | 'reflection';
  content: string;
  timestamp: Date;
  confidence: number;
  reasoning: string;
}
