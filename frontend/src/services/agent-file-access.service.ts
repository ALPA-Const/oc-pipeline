import api from './api';

export interface AgentFileAccess {
  id: string;
  agent_id: string;
  file_id: string;
  access_type: string;
  access_reason?: string;
  task_id?: string;
  project_id?: string;
  org_id?: string;
  accessed_at: string;
  duration_ms?: number;
  success: boolean;
  error_message?: string;
  metadata?: any;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  agent_name?: string;
}

export interface AgentFilePermission {
  id: string;
  agent_id: string;
  file_pattern?: string;
  mime_type_pattern?: string;
  folder_id?: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_analyze: boolean;
  org_id?: string;
  project_id?: string;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  reason?: string;
  granted_by_name?: string;
  folder_name?: string;
}

export interface AgentFileOperation {
  id: string;
  agent_id: string;
  file_id?: string;
  operation_type: string;
  task_id?: string;
  project_id?: string;
  org_id?: string;
  file_name?: string;
  file_path?: string;
  mime_type?: string;
  size_bytes?: number;
  changes?: any;
  success: boolean;
  error_message?: string;
  performed_at: string;
  agent_name?: string;
  current_file_name?: string;
}

export interface FileAccessStats {
  total_accesses: number;
  unique_files: number;
  successful_accesses: number;
  failed_accesses: number;
  avg_duration_ms?: number;
  accesses_by_type?: Record<string, number>;
}

class AgentFileAccessService {
  /**
   * Check if an agent has permission to access a file
   */
  async checkFilePermission(
    agentId: string,
    fileId: string,
    accessType: string
  ): Promise<{ hasPermission: boolean }> {
    const response = await api.get(
      `/atlas/agents/${agentId}/file-access/check`,
      {
        params: { fileId, accessType }
      }
    );
    return response.data.data;
  }

  /**
   * Get file access history for an agent
   */
  async getAgentFileAccess(
    agentId: string,
    filters?: {
      fileId?: string;
      accessType?: string;
      projectId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentFileAccess[]> {
    const response = await api.get(`/atlas/agents/${agentId}/file-access`, {
      params: filters
    });
    return response.data.data.accessHistory;
  }

  /**
   * Get file access history for a specific file
   */
  async getFileAccessHistory(
    fileId: string,
    filters?: {
      agentId?: string;
      accessType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentFileAccess[]> {
    const response = await api.get(`/atlas/files/${fileId}/access-history`, {
      params: filters
    });
    return response.data.data.accessHistory;
  }

  /**
   * Record file access by an agent
   */
  async recordFileAccess(
    agentId: string,
    accessData: {
      fileId: string;
      accessType: string;
      accessReason?: string;
      taskId?: string;
      projectId?: string;
      orgId?: string;
      durationMs?: number;
      success?: boolean;
      errorMessage?: string;
      metadata?: any;
    }
  ): Promise<AgentFileAccess> {
    const response = await api.post(
      `/atlas/agents/${agentId}/file-access`,
      accessData
    );
    return response.data.data;
  }

  /**
   * Grant file permission to an agent
   */
  async grantFilePermission(
    agentId: string,
    permissionData: {
      filePattern?: string;
      mimeTypePattern?: string;
      folderId?: string;
      canRead?: boolean;
      canWrite?: boolean;
      canDelete?: boolean;
      canAnalyze?: boolean;
      orgId?: string;
      projectId?: string;
      reason?: string;
      expiresAt?: Date;
    }
  ): Promise<AgentFilePermission> {
    const response = await api.post(
      `/atlas/agents/${agentId}/file-permissions`,
      permissionData
    );
    return response.data.data;
  }

  /**
   * Revoke file permission
   */
  async revokeFilePermission(permissionId: string): Promise<AgentFilePermission> {
    const response = await api.delete(`/atlas/file-permissions/${permissionId}`);
    return response.data.data;
  }

  /**
   * Get agent file permissions
   */
  async getAgentPermissions(
    agentId: string,
    activeOnly: boolean = true
  ): Promise<AgentFilePermission[]> {
    const response = await api.get(`/atlas/agents/${agentId}/file-permissions`, {
      params: { activeOnly }
    });
    return response.data.data.permissions;
  }

  /**
   * Get file operations for an agent
   */
  async getAgentFileOperations(
    agentId: string,
    filters?: {
      operationType?: string;
      projectId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentFileOperation[]> {
    const response = await api.get(`/atlas/agents/${agentId}/file-operations`, {
      params: filters
    });
    return response.data.data.operations;
  }

  /**
   * Record file operation by an agent
   */
  async recordFileOperation(
    agentId: string,
    operationData: {
      fileId?: string;
      operationType: string;
      taskId?: string;
      projectId?: string;
      orgId?: string;
      fileName?: string;
      filePath?: string;
      mimeType?: string;
      sizeBytes?: number;
      changes?: any;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<AgentFileOperation> {
    const response = await api.post(
      `/atlas/agents/${agentId}/file-operations`,
      operationData
    );
    return response.data.data;
  }

  /**
   * Get agent file access statistics
   */
  async getAgentFileAccessStats(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FileAccessStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get(`/atlas/agents/${agentId}/file-access/stats`, {
      params
    });
    return response.data.data.stats;
  }
}

export default new AgentFileAccessService();
