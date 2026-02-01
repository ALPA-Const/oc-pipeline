/**
 * Session Creator - Elite AutoGPT Session Configuration
 * High-end interface for creating and configuring autonomous agent sessions
 */

import React, { useState } from 'react';
import {
  Brain,
  Plus,
  X,
  Settings,
  Zap,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { SessionConfig, ToolType } from '@/types/autogpt.types';

interface SessionCreatorProps {
  onCreateSession: (name: string, goals: string[], config: Partial<SessionConfig>) => void;
  onClose: () => void;
}

export const SessionCreator: React.FC<SessionCreatorProps> = ({
  onCreateSession,
  onClose,
}) => {
  const [sessionName, setSessionName] = useState('');
  const [goals, setGoals] = useState<string[]>(['']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [config, setConfig] = useState<Partial<SessionConfig>>({
    max_iterations: 100,
    max_tokens: 10000,
    temperature: 0.7,
    auto_continue: false,
    require_approval: true,
    timeout_seconds: 300,
    allowed_tools: ['web-search', 'api-call', 'calculation', 'analysis'],
  });

  const tools: { type: ToolType; label: string; description: string }[] = [
    { type: 'web-search', label: 'Web Search', description: 'Search the internet for information' },
    { type: 'file-read', label: 'File Read', description: 'Read files from the system' },
    { type: 'file-write', label: 'File Write', description: 'Write files to the system' },
    { type: 'api-call', label: 'API Call', description: 'Make API requests' },
    { type: 'calculation', label: 'Calculation', description: 'Perform calculations' },
    { type: 'code-execution', label: 'Code Execution', description: 'Execute code' },
    { type: 'database-query', label: 'Database Query', description: 'Query databases' },
    { type: 'analysis', label: 'Analysis', description: 'Analyze data' },
  ];

  const addGoal = () => {
    setGoals([...goals, '']);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const toggleTool = (tool: ToolType) => {
    const currentTools = config.allowed_tools || [];
    const newTools = currentTools.includes(tool)
      ? currentTools.filter(t => t !== tool)
      : [...currentTools, tool];
    setConfig({ ...config, allowed_tools: newTools });
  };

  const handleCreate = () => {
    const validGoals = goals.filter(g => g.trim() !== '');
    if (sessionName.trim() === '' || validGoals.length === 0) {
      alert('Please provide a session name and at least one goal');
      return;
    }
    onCreateSession(sessionName, validGoals, config);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create AutoGPT Session</h2>
              <p className="text-white/80 text-sm">Configure your autonomous agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Name
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Construction Analysis Agent"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">
                Agent Goals
              </label>
              <button
                onClick={addGoal}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>
            
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-sm font-medium mt-1">
                    {index + 1}
                  </div>
                  <textarea
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    placeholder="Describe what you want the agent to accomplish..."
                    rows={2}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {goals.length > 1 && (
                    <button
                      onClick={() => removeGoal(index)}
                      className="flex-shrink-0 p-2 hover:bg-red-600/10 rounded-lg text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              {/* Allowed Tools */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Allowed Tools
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tools.map((tool) => (
                    <button
                      key={tool.type}
                      onClick={() => toggleTool(tool.type)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        config.allowed_tools?.includes(tool.type)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{tool.label}</span>
                        {config.allowed_tools?.includes(tool.type) && (
                          <Zap className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{tool.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    value={config.max_iterations}
                    onChange={(e) => setConfig({ ...config, max_iterations: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={config.max_tokens}
                    onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Temperature ({config.temperature?.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={config.timeout_seconds}
                    onChange={(e) => setConfig({ ...config, timeout_seconds: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium text-white">Auto Continue</div>
                      <div className="text-xs text-slate-400">Agent continues without manual approval</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_continue}
                    onChange={(e) => setConfig({ ...config, auto_continue: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm font-medium text-white">Require Approval</div>
                      <div className="text-xs text-slate-400">Approve each action before execution</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.require_approval}
                    onChange={(e) => setConfig({ ...config, require_approval: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
};
