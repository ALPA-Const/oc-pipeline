import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AgentFileAccessDashboard from '@/components/atlas/AgentFileAccessDashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * ATLAS Agent File Access Page
 * Displays file access dashboard for a specific AI agent
 */
const AtlasAgentFileAccess: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();

  if (!agentId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid agent ID. Please select an agent from the ATLAS dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AgentFileAccessDashboard agentId={agentId} />
    </div>
  );
};

export default AtlasAgentFileAccess;
