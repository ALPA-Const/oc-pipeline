import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * AgentFileAccessService
 * 
 * Manages file access permissions and tracking for AI agents.
 * Logs all file operations performed by agents for audit and compliance.
 */
class AgentFileAccessService {
  constructor() {
    this.db = pool;
  }

  /**
   * Check if an agent has permission to access a file
   * @param {string} agentId - Agent UUID
   * @param {string} fileId - File UUID
   * @param {string} accessType - Type of access (read, write, delete, analyze)
   * @returns {Promise<boolean>} Whether access is permitted
   */
  async checkFilePermission(agentId: string, fileId: string, accessType: string): Promise<boolean> {
    try {
      // Get file details
      const fileResult = await this.db.query(
        `SELECT f.*, fo.path as folder_path 
         FROM files f
         LEFT JOIN folders fo ON f.folder_id = fo.id
         WHERE f.id = $1`,
        [fileId]
      );

      if (fileResult.rows.length === 0) {
        logger.warn('File not found for permission check', { agentId, fileId });
        return false;
      }

      const file = fileResult.rows[0];

      // Get agent permissions
      const permResult = await this.db.query(
        `SELECT * FROM agent_file_permissions 
         WHERE agent_id = $1 
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (org_id = $2 OR org_id IS NULL)
         AND (project_id = $3 OR project_id IS NULL)`,
        [agentId, file.org_id, file.project_id]
      );

      if (permResult.rows.length === 0) {
        logger.debug('No permissions found for agent', { agentId, fileId });
        return false;
      }

      // Check each permission rule
      for (const perm of permResult.rows) {
        // Check file pattern
        if (perm.file_pattern) {
          const pattern = new RegExp('^' + perm.file_pattern.replace(/\*/g, '.*') + '$');
          if (!pattern.test(file.name)) {
            continue;
          }
        }

        // Check MIME type pattern
        if (perm.mime_type_pattern) {
          const mimePattern = new RegExp('^' + perm.mime_type_pattern.replace(/\*/g, '.*') + '$');
          if (!mimePattern.test(file.mime_type || '')) {
            continue;
          }
        }

        // Check folder
        if (perm.folder_id && perm.folder_id !== file.folder_id) {
          continue;
        }

        // Check specific permission type
        const hasPermission = 
          (accessType === 'read' && perm.can_read) ||
          (accessType === 'write' && perm.can_write) ||
          (accessType === 'delete' && perm.can_delete) ||
          (accessType === 'analyze' && perm.can_analyze) ||
          (accessType === 'extract' && perm.can_analyze);

        if (hasPermission) {
          logger.debug('Permission granted', { agentId, fileId, accessType, permissionId: perm.id });
          return true;
        }
      }

      logger.debug('No matching permissions found', { agentId, fileId, accessType });
      return false;
    } catch (error) {
      logger.error('Error checking file permission:', { agentId, fileId, accessType, error: (error as Error).message });
      return false; // Deny access on error
    }
  }

  /**
   * Record file access by an agent
   * @param {Object} access - Access details
   * @returns {Promise<Object>} Created access record
   */
  async recordFileAccess(access: {
    agentId: string;
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
  }): Promise<any> {
    try {
      const result = await this.db.query(
        `INSERT INTO agent_file_access (
          agent_id, file_id, access_type, access_reason,
          task_id, project_id, org_id,
          duration_ms, success, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          access.agentId,
          access.fileId,
          access.accessType,
          access.accessReason || null,
          access.taskId || null,
          access.projectId || null,
          access.orgId || null,
          access.durationMs || null,
          access.success ?? true, // Default to true if undefined
          access.errorMessage || null,
          access.metadata || {}
        ]
      );

      logger.info('File access recorded', {
        agentId: access.agentId,
        fileId: access.fileId,
        accessType: access.accessType,
        accessId: result.rows[0].id
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error recording file access:', { access, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get file access history for an agent
   * @param {string} agentId - Agent UUID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Access history
   */
  async getAgentFileAccess(agentId: string, filters: {
    fileId?: string;
    accessType?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          afa.*,
          f.name as file_name,
          f.mime_type,
          f.size_bytes,
          a.name as agent_name
        FROM agent_file_access afa
        LEFT JOIN files f ON afa.file_id = f.id
        LEFT JOIN agents a ON afa.agent_id = a.id
        WHERE afa.agent_id = $1
      `;
      const params: any[] = [agentId];
      let paramCount = 2;

      if (filters.fileId) {
        query += ` AND afa.file_id = $${paramCount}`;
        params.push(filters.fileId);
        paramCount++;
      }

      if (filters.accessType) {
        query += ` AND afa.access_type = $${paramCount}`;
        params.push(filters.accessType);
        paramCount++;
      }

      if (filters.projectId) {
        query += ` AND afa.project_id = $${paramCount}`;
        params.push(filters.projectId);
        paramCount++;
      }

      query += ` ORDER BY afa.accessed_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting agent file access:', { agentId, filters, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get file access history for a specific file
   * @param {string} fileId - File UUID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Access history
   */
  async getFileAccessHistory(fileId: string, filters: {
    agentId?: string;
    accessType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          afa.*,
          a.name as agent_name,
          a.agent_code,
          a.module
        FROM agent_file_access afa
        LEFT JOIN agents a ON afa.agent_id = a.id
        WHERE afa.file_id = $1
      `;
      const params: any[] = [fileId];
      let paramCount = 2;

      if (filters.agentId) {
        query += ` AND afa.agent_id = $${paramCount}`;
        params.push(filters.agentId);
        paramCount++;
      }

      if (filters.accessType) {
        query += ` AND afa.access_type = $${paramCount}`;
        params.push(filters.accessType);
        paramCount++;
      }

      query += ` ORDER BY afa.accessed_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting file access history:', { fileId, filters, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Grant file access permission to an agent
   * @param {Object} permission - Permission details
   * @returns {Promise<Object>} Created permission
   */
  async grantFilePermission(permission: {
    agentId: string;
    filePattern?: string;
    mimeTypePattern?: string;
    folderId?: string;
    canRead?: boolean;
    canWrite?: boolean;
    canDelete?: boolean;
    canAnalyze?: boolean;
    orgId?: string;
    projectId?: string;
    grantedBy: string;
    reason?: string;
    expiresAt?: Date;
  }): Promise<any> {
    try {
      const result = await this.db.query(
        `INSERT INTO agent_file_permissions (
          agent_id, file_pattern, mime_type_pattern, folder_id,
          can_read, can_write, can_delete, can_analyze,
          org_id, project_id, granted_by, reason, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          permission.agentId,
          permission.filePattern || null,
          permission.mimeTypePattern || null,
          permission.folderId || null,
          permission.canRead || false,
          permission.canWrite || false,
          permission.canDelete || false,
          permission.canAnalyze ?? true, // Default to true if undefined
          permission.orgId || null,
          permission.projectId || null,
          permission.grantedBy,
          permission.reason || null,
          permission.expiresAt || null
        ]
      );

      logger.info('File permission granted', {
        agentId: permission.agentId,
        permissionId: result.rows[0].id,
        grantedBy: permission.grantedBy
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error granting file permission:', { permission, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Revoke file access permission
   * @param {string} permissionId - Permission UUID
   * @returns {Promise<Object>} Updated permission
   */
  async revokeFilePermission(permissionId: string): Promise<any> {
    try {
      const result = await this.db.query(
        `UPDATE agent_file_permissions 
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [permissionId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Permission not found: ${permissionId}`);
      }

      logger.info('File permission revoked', { permissionId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error revoking file permission:', { permissionId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get agent file permissions
   * @param {string} agentId - Agent UUID
   * @param {boolean} activeOnly - Only return active permissions
   * @returns {Promise<Array>} List of permissions
   */
  async getAgentPermissions(agentId: string, activeOnly: boolean = true): Promise<any[]> {
    try {
      let query = `
        SELECT 
          afp.*,
          u.name as granted_by_name,
          f.name as folder_name
        FROM agent_file_permissions afp
        LEFT JOIN users u ON afp.granted_by = u.id
        LEFT JOIN folders f ON afp.folder_id = f.id
        WHERE afp.agent_id = $1
      `;
      
      if (activeOnly) {
        query += ` AND afp.is_active = true AND (afp.expires_at IS NULL OR afp.expires_at > NOW())`;
      }

      query += ` ORDER BY afp.created_at DESC`;

      const result = await this.db.query(query, [agentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting agent permissions:', { agentId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Record file operation by an agent
   * @param {Object} operation - Operation details
   * @returns {Promise<Object>} Created operation record
   */
  async recordFileOperation(operation: {
    agentId: string;
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
  }): Promise<any> {
    try {
      const result = await this.db.query(
        `INSERT INTO agent_file_operations (
          agent_id, file_id, operation_type,
          task_id, project_id, org_id,
          file_name, file_path, mime_type, size_bytes,
          changes, success, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          operation.agentId,
          operation.fileId || null,
          operation.operationType,
          operation.taskId || null,
          operation.projectId || null,
          operation.orgId || null,
          operation.fileName || null,
          operation.filePath || null,
          operation.mimeType || null,
          operation.sizeBytes || null,
          operation.changes || null,
          operation.success ?? true, // Default to true if undefined
          operation.errorMessage || null
        ]
      );

      logger.info('File operation recorded', {
        agentId: operation.agentId,
        operationType: operation.operationType,
        operationId: result.rows[0].id
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error recording file operation:', { operation, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get file operations for an agent
   * @param {string} agentId - Agent UUID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Operations history
   */
  async getAgentFileOperations(agentId: string, filters: {
    operationType?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          afo.*,
          f.name as current_file_name,
          a.name as agent_name
        FROM agent_file_operations afo
        LEFT JOIN files f ON afo.file_id = f.id
        LEFT JOIN agents a ON afo.agent_id = a.id
        WHERE afo.agent_id = $1
      `;
      const params: any[] = [agentId];
      let paramCount = 2;

      if (filters.operationType) {
        query += ` AND afo.operation_type = $${paramCount}`;
        params.push(filters.operationType);
        paramCount++;
      }

      if (filters.projectId) {
        query += ` AND afo.project_id = $${paramCount}`;
        params.push(filters.projectId);
        paramCount++;
      }

      query += ` ORDER BY afo.performed_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting agent file operations:', { agentId, filters, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get file access statistics for an agent
   * @param {string} agentId - Agent UUID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics
   */
  async getAgentFileAccessStats(agentId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_accesses,
          COUNT(DISTINCT file_id) as unique_files,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_accesses,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_accesses,
          AVG(duration_ms) as avg_duration_ms
        FROM agent_file_access
        WHERE agent_id = $1
      `;
      const params: any[] = [agentId];
      let paramCount = 2;

      if (startDate) {
        query += ` AND accessed_at >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        query += ` AND accessed_at <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      const statsResult = await this.db.query(query, params);
      
      // Get accesses by type separately
      let typeQuery = `
        SELECT access_type, COUNT(*) as count
        FROM agent_file_access
        WHERE agent_id = $1
      `;
      const typeParams: any[] = [agentId];
      let typeParamCount = 2;

      if (startDate) {
        typeQuery += ` AND accessed_at >= $${typeParamCount}`;
        typeParams.push(startDate);
        typeParamCount++;
      }

      if (endDate) {
        typeQuery += ` AND accessed_at <= $${typeParamCount}`;
        typeParams.push(endDate);
      }

      typeQuery += ` GROUP BY access_type`;

      const typeResult = await this.db.query(typeQuery, typeParams);
      
      const accessesByType: Record<string, number> = {};
      typeResult.rows.forEach(row => {
        accessesByType[row.access_type] = parseInt(row.count);
      });

      const stats = statsResult.rows.length > 0 ? statsResult.rows[0] : {
        total_accesses: 0,
        unique_files: 0,
        successful_accesses: 0,
        failed_accesses: 0,
        avg_duration_ms: null,
      };

      return {
        ...stats,
        accesses_by_type: accessesByType
      };
    } catch (error) {
      logger.error('Error getting agent file access stats:', { agentId, error: (error as Error).message });
      throw error;
    }
  }
}

export default new AgentFileAccessService();
