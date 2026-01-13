/**
 * AutoGPT Dashboard Page
 * Elite autonomous agent management interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Plus,
  Play,
  Pause,
  Trash2,
  Settings,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CommandCenterHeader, LiveActivityFeed, SystemStats } from '@/components/autogpt/CommandCenter';
import { AgentVisualizer, TaskPipeline } from '@/components/autogpt/AgentVisualizer';
import { SessionCreator } from '@/components/autogpt/SessionCreator';
import { autoGPTService } from '@/services/autogpt.service';
import type { AutoGPTSession, AgentMetrics, SessionConfig } from '@/types/autogpt.types';

export const AutoGPTDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AutoGPTSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AutoGPTSession | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    total_sessions: 0,
    active_agents: 0,
    tasks_in_queue: 0,
    avg_completion_time: 0,
    success_rate: 0,
    total_cost: 0,
    tokens_used_today: 0,
    cost_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  
  // Activity feed
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    agent?: string;
  }>>([]);

  // System stats (simulated)
  const [systemStats] = useState({
    cpuUsage: 45.2,
    memoryUsage: 62.8,
    activeConnections: 3,
  });

  useEffect(() => {
    loadData();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, metricsData] = await Promise.all([
        autoGPTService.getAllSessions(),
        autoGPTService.getMetrics(),
      ]);
      
      setSessions(sessionsData);
      setMetrics(metricsData);
      
      // Update selected session if it exists
      if (selectedSession) {
        const updated = sessionsData.find(s => s.id === selectedSession.id);
        if (updated) {
          setSelectedSession(updated);
          
          // Add activity for new thoughts
          const newThoughts = updated.agent.thoughts.slice(-1);
          if (newThoughts.length > 0 && newThoughts[0].content) {
            const existingActivity = activities.find(
              a => a.message === newThoughts[0].content
            );
            if (!existingActivity) {
              addActivity('info', newThoughts[0].content, updated.agent.name);
            }
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load AutoGPT data:', error);
      setLoading(false);
    }
  };

  const addActivity = (
    type: 'info' | 'success' | 'warning' | 'error',
    message: string,
    agent?: string
  ) => {
    const newActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      message,
      timestamp: new Date(),
      agent,
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  };

  const handleCreateSession = async (
    name: string,
    goals: string[],
    config: Partial<SessionConfig>
  ) => {
    try {
      const session = await autoGPTService.createSession(name, goals, config);
      addActivity('success', `Created new session: ${name}`);
      setSessions([...sessions, session]);
      setSelectedSession(session);
      setShowCreator(false);
      
      // Start the agent
      setTimeout(() => {
        handleRunAgent(session.id);
      }, 500);
    } catch (error) {
      console.error('Failed to create session:', error);
      addActivity('error', 'Failed to create session');
    }
  };

  const handleRunAgent = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    addActivity('info', `Starting agent: ${session.agent.name}`, session.agent.name);
    
    try {
      await autoGPTService.runAgent(sessionId);
      addActivity('success', `Agent completed all tasks`, session.agent.name);
      await loadData();
    } catch (error) {
      console.error('Failed to run agent:', error);
      addActivity('error', 'Agent execution failed', session.agent.name);
    }
  };

  const handlePauseSession = async (sessionId: string) => {
    try {
      await autoGPTService.pauseSession(sessionId);
      addActivity('warning', 'Session paused');
      await loadData();
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      await autoGPTService.resumeSession(sessionId);
      addActivity('info', 'Session resumed');
      await loadData();
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await autoGPTService.deleteSession(sessionId);
      addActivity('warning', 'Session deleted');
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Elite Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          
          <div className="relative z-10 container mx-auto max-w-[1920px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xl">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      AutoGPT Command Center
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </h1>
                    <p className="text-white/90 text-lg">
                      Elite Autonomous Agent Management System
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl font-semibold transition-all shadow-lg hover:shadow-2xl border border-white/20"
              >
                <Plus className="w-5 h-5" />
                New Session
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-[1920px] px-6 py-6 space-y-6">
          {/* Metrics Row */}
          <CommandCenterHeader metrics={metrics} loading={loading} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Sessions List (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  Active Sessions
                </h3>
                
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sessions yet</p>
                      <button
                        onClick={() => setShowCreator(true)}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Create your first session
                      </button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedSession?.id === session.id
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-white">{session.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            session.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            session.status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
                            session.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-400 mb-2">
                          {session.agent.name} • {session.tasks.length} tasks
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {session.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePauseSession(session.id);
                              }}
                              className="p-1.5 hover:bg-slate-700 rounded text-orange-400"
                              title="Pause"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {session.status === 'paused' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResumeSession(session.id);
                              }}
                              className="p-1.5 hover:bg-slate-700 rounded text-green-400"
                              title="Resume"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded text-red-400 ml-auto"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* System Stats */}
              <SystemStats
                cpuUsage={systemStats.cpuUsage}
                memoryUsage={systemStats.memoryUsage}
                activeConnections={systemStats.activeConnections}
              />
            </div>

            {/* Center Column - Agent Visualizer (6 cols) */}
            <div className="lg:col-span-6">
              {selectedSession ? (
                <AgentVisualizer
                  agent={selectedSession.agent}
                  showThoughts={true}
                  showActions={true}
                />
              ) : (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center">
                  <Brain className="w-24 h-24 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Session Selected
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Select a session from the list or create a new one to get started
                  </p>
                  <button
                    onClick={() => setShowCreator(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Session
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Activity & Tasks (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <LiveActivityFeed activities={activities} />
              
              {selectedSession && (
                <TaskPipeline tasks={selectedSession.tasks} />
              )}
            </div>
          </div>
        </div>

        {/* Session Creator Modal */}
        {showCreator && (
          <SessionCreator
            onCreateSession={handleCreateSession}
            onClose={() => setShowCreator(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default AutoGPTDashboard;
