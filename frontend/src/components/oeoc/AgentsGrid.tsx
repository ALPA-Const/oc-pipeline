// =====================================================
// OEOC Agents Grid - The Swarm
// View and manage 50+ AI workers
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Bot, 
  RefreshCw, 
  Search,
  Filter,
  Zap,
  Clock,
  Tag,
  Power
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { Agent } from '@/types/oeoc.types';

export function AgentsGrid() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await oeocService.agents.getAll();
      setAgents(data);
      setFilteredAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = agents;
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.capability_tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }
    
    setFilteredAgents(filtered);
  }, [agents, searchTerm, typeFilter]);

  const handleToggle = async (agent: Agent) => {
    try {
      await oeocService.agents.toggle(agent.id, agent.status === 'disabled');
      loadData();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500';
      case 'busy': return 'bg-amber-500 animate-pulse';
      case 'error': return 'bg-red-500';
      case 'disabled': return 'bg-gray-400';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const statusCounts = {
    total: agents.length,
    idle: agents.filter(a => a.status === 'idle').length,
    busy: agents.filter(a => a.status === 'busy').length,
    error: agents.filter(a => a.status === 'error').length,
    disabled: agents.filter(a => a.status === 'disabled').length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">The Swarm</h1>
          <p className="text-muted-foreground">Manage your AI worker agents</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 rounded-full bg-muted">{statusCounts.total} total</span>
        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {statusCounts.idle} idle
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          {statusCounts.busy} busy
        </span>
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {statusCounts.error} error
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={typeFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={typeFilter === 'agentic' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('agentic')}
          >
            Agentic
          </Button>
          <Button 
            variant={typeFilter === 'worker' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('worker')}
          >
            Worker
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAgents.map((agent) => (
          <Card 
            key={agent.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => { setSelectedAgent(agent); setSheetOpen(true); }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                  <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">{agent.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {agent.capability_tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded-full">
                    {tag}
                  </span>
                ))}
                {agent.capability_tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{agent.capability_tags.length - 3}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {agent.last_heartbeat 
                    ? `${Math.floor((Date.now() - new Date(agent.last_heartbeat).getTime()) / 1000)}s ago`
                    : 'Never'}
                </span>
                <Switch
                  checked={agent.status !== 'disabled'}
                  onCheckedChange={() => handleToggle(agent)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedAgent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {selectedAgent.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedAgent.type} agent • {selectedAgent.orchestrator?.name || 'Unassigned'}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Status & Control */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Power className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Agent Status</p>
                      <p className="text-sm text-muted-foreground capitalize">{selectedAgent.status}</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedAgent.status !== 'disabled'}
                    onCheckedChange={() => handleToggle(selectedAgent)}
                  />
                </div>

                {/* Capability Tags */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.capability_tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Current Task */}
                {selectedAgent.current_step_id && (
                  <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Currently Working</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Step ID: {selectedAgent.current_step_id}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h3 className="font-medium mb-3">Metadata</h3>
                  <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedAgent.metadata, null, 2)}
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

export default AgentsGrid;

