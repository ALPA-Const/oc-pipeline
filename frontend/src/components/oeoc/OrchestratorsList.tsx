// =====================================================
// OEOC Orchestrators List
// View and manage the 5 "Brains"
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  RefreshCw, 
  Settings, 
  Power,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { Orchestrator, Agent } from '@/types/oeoc.types';

export function OrchestratorsList() {
  const [orchestrators, setOrchestrators] = useState<Orchestrator[]>([]);
  const [selectedOrch, setSelectedOrch] = useState<Orchestrator | null>(null);
  const [orchAgents, setOrchAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await oeocService.orchestrators.getAll();
      setOrchestrators(data);
    } catch (error) {
      console.error('Failed to load orchestrators:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadOrchAgents = async (orchId: string) => {
    try {
      const agents = await oeocService.agents.getByOrchestrator(orchId);
      setOrchAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrchClick = async (orch: Orchestrator) => {
    setSelectedOrch(orch);
    setSheetOpen(true);
    await loadOrchAgents(orch.id);
  };

  const handleKillSwitch = async (orch: Orchestrator) => {
    try {
      await oeocService.orchestrators.updateStatus(orch.id, 'offline');
      loadData();
    } catch (error) {
      console.error('Kill switch failed:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'idle': return { color: 'bg-green-500', text: 'Idle', variant: 'default' as const };
      case 'busy': return { color: 'bg-amber-500', text: 'Busy', variant: 'secondary' as const };
      case 'error': return { color: 'bg-red-500', text: 'Error', variant: 'destructive' as const };
      case 'offline': return { color: 'bg-gray-500', text: 'Offline', variant: 'outline' as const };
      default: return { color: 'bg-gray-500', text: status, variant: 'outline' as const };
    }
  };

  const formatHeartbeat = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orchestrators</h1>
          <p className="text-muted-foreground">The 5 "Brains" managing your AI swarm</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orchestrators.map((orch) => {
          const statusConfig = getStatusConfig(orch.status);
          return (
            <Card 
              key={orch.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleOrchClick(orch)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
                    <CardTitle className="text-lg">{orch.name}</CardTitle>
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.text}</Badge>
                </div>
                <CardDescription>{orch.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Active Runs
                    </span>
                    <span className="font-medium">{orch.current_run_count}/{orch.max_concurrent_runs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last Heartbeat
                    </span>
                    <span className="font-medium">{formatHeartbeat(orch.last_heartbeat)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Orchestrator Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedOrch && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {selectedOrch.name}
                </SheetTitle>
                <SheetDescription>{selectedOrch.description}</SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Kill Switch */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-3">
                    <Power className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-600">Kill Switch</p>
                      <p className="text-sm text-muted-foreground">Emergency shutdown</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleKillSwitch(selectedOrch)}
                    disabled={selectedOrch.status === 'offline'}
                  >
                    Stop
                  </Button>
                </div>

                {/* Assigned Agents */}
                <div>
                  <h3 className="font-medium mb-3">Assigned Agents ({orchAgents.length})</h3>
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {orchAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'idle' ? 'bg-green-500' :
                            agent.status === 'busy' ? 'bg-amber-500' :
                            agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-sm">{agent.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{agent.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Config JSON */}
                <div>
                  <h3 className="font-medium mb-3">Configuration</h3>
                  <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedOrch.config, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default OrchestratorsList;
