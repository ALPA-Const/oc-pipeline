/**
 * Agent Visualizer - Elite thought process viewer
 * Displays agent thinking, planning, and execution in real-time
 */

import React, { useEffect, useRef } from 'react';
import {
  Brain,
  Lightbulb,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import type { Agent, AgentThought, AgentAction, Task } from '@/types/autogpt.types';

interface AgentVisualizerProps {
  agent: Agent;
  showThoughts?: boolean;
  showActions?: boolean;
}

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({
  agent,
  showThoughts = true,
  showActions = true,
}) => {
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.thoughts, agent.actions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'text-slate-400';
      case 'planning':
        return 'text-blue-400';
      case 'thinking':
        return 'text-purple-400';
      case 'executing':
        return 'text-green-400';
      case 'waiting':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-400';
      case 'paused':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <Eye className="w-5 h-5" />;
      case 'planning':
      case 'thinking':
        return <Brain className="w-5 h-5 animate-pulse" />;
      case 'executing':
        return <Zap className="w-5 h-5 animate-bounce" />;
      case 'waiting':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
      {/* Agent Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${getStatusColor(agent.status)} bg-slate-900 flex items-center justify-center`}>
                {getStatusIcon(agent.status)}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white">{agent.name}</h3>
              <p className="text-sm text-slate-400 capitalize">
                {agent.type.replace('-', ' ')} • {agent.status}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {agent.stats.tasks_completed}
            </div>
            <div className="text-sm text-slate-400">Tasks Completed</div>
          </div>
        </div>

        {/* Progress Bar for Current Task */}
        {agent.current_task && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">
                {agent.current_task.title}
              </span>
              <span className="text-sm font-bold text-white">
                {agent.current_task.progress}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                style={{ width: `${agent.current_task.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Thoughts & Actions Container */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
        {showThoughts && agent.thoughts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h4 className="text-lg font-bold text-white">Thought Process</h4>
            </div>
            <div className="space-y-3">
              {agent.thoughts.slice(-10).map((thought) => (
                <ThoughtBubble key={thought.id} thought={thought} />
              ))}
            </div>
          </div>
        )}

        {showActions && agent.actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-400" />
              <h4 className="text-lg font-bold text-white">Actions</h4>
            </div>
            <div className="space-y-3">
              {agent.actions.slice(-10).map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}

        <div ref={thoughtsEndRef} />
      </div>
    </div>
  );
};

interface ThoughtBubbleProps {
  thought: AgentThought;
}

const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ thought }) => {
  const getThoughtIcon = (type: string) => {
    switch (type) {
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'planning':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'observation':
        return <Eye className="w-4 h-4 text-green-400" />;
      case 'decision':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const getThoughtColor = (type: string) => {
    switch (type) {
      case 'reasoning':
        return 'border-purple-500/20 bg-purple-500/10';
      case 'planning':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'observation':
        return 'border-green-500/20 bg-green-500/10';
      case 'decision':
        return 'border-yellow-500/20 bg-yellow-500/10';
      default:
        return 'border-slate-500/20 bg-slate-500/10';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getThoughtColor(thought.type)} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getThoughtIcon(thought.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase">
              {thought.type}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(thought.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-slate-300">{thought.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: `${thought.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-500">
              {(thought.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ActionCardProps {
  action: AgentAction;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 text-slate-400" />;
      case 'executing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-slate-500/20 bg-slate-500/10';
      case 'executing':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'completed':
        return 'border-green-500/20 bg-green-500/10';
      case 'failed':
        return 'border-red-500/20 bg-red-500/10';
      default:
        return 'border-slate-500/20 bg-slate-500/10';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getActionStatusColor(action.status)} transition-all duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getActionStatusIcon(action.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{action.tool}</span>
            <span className="text-xs text-slate-500">
              {new Date(action.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {action.status === 'completed' && action.duration_ms && (
            <div className="text-xs text-slate-400 mb-2">
              Completed in {action.duration_ms}ms
            </div>
          )}
          
          {action.error && (
            <div className="text-xs text-red-400 mt-2 p-2 bg-red-500/10 rounded">
              Error: {action.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskPipelineProps {
  tasks: Task[];
}

export const TaskPipeline: React.FC<TaskPipelineProps> = ({ tasks }) => {
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-500/20 border-slate-500/50';
      case 'in-progress':
        return 'bg-blue-500/20 border-blue-500/50';
      case 'completed':
        return 'bg-green-500/20 border-green-500/50';
      case 'failed':
        return 'bg-red-500/20 border-red-500/50';
      case 'blocked':
        return 'bg-orange-500/20 border-orange-500/50';
      default:
        return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Task Pipeline</h3>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks in pipeline</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border ${getTaskStatusColor(task.status)} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{task.title}</h4>
                <span className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-300 capitalize">
                  {task.status.replace('-', ' ')}
                </span>
              </div>
              
              {task.description && (
                <p className="text-xs text-slate-400 mb-3">{task.description}</p>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {task.progress}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
