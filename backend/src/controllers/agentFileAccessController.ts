import { Request, Response } from 'express';
import agentFileAccessService from '../services/ai/agent-file-access.service.js';
import agentOrchestratorService from '../services/ai/agent-orchestrator.service.js';
import logger from '../utils/logger.js';

/**
 * Agent File Access Controller
 * Handles API endpoints for agent file access management
 */

/**
 * Check if agent has permission to access a file
 * GET /api/atlas/agents/:agentId/file-access/check
 */
export const checkFilePermission = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { fileId, accessType } = req.query;

    if (!fileId || !accessType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'fileId and accessType are required'
        }
      });
    }

    const hasPermission = await agentFileAccessService.checkFilePermission(
      agentId,
      fileId as string,
      accessType as string
    );

    res.json({
      success: true,
      data: {
        agentId,
        fileId,
        accessType,
        hasPermission
      }
    });
  } catch (error) {
    logger.error('Error checking file permission:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check file permission'
      }
    });
  }
};

/**
 * Get file access history for an agent
 * GET /api/atlas/agents/:agentId/file-access
 */
export const getAgentFileAccess = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { fileId, accessType, projectId, limit, offset } = req.query;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    const filters: any = {};
    if (fileId) filters.fileId = fileId;
    if (accessType) filters.accessType = accessType;
    if (projectId) filters.projectId = projectId;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const accessHistory = await agentFileAccessService.getAgentFileAccess(agentId, filters);

    res.json({
      success: true,
      data: {
        agentId,
        accessHistory,
        count: accessHistory.length
      }
    });
  } catch (error) {
    logger.error('Error getting agent file access:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get agent file access history'
      }
    });
  }
};

/**
 * Get file access history for a specific file
 * GET /api/atlas/files/:fileId/access-history
 */
export const getFileAccessHistory = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { agentId, accessType, limit, offset } = req.query;

    const filters: any = {};
    if (agentId) filters.agentId = agentId;
    if (accessType) filters.accessType = accessType;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const accessHistory = await agentFileAccessService.getFileAccessHistory(fileId, filters);

    res.json({
      success: true,
      data: {
        fileId,
        accessHistory,
        count: accessHistory.length
      }
    });
  } catch (error) {
    logger.error('Error getting file access history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get file access history'
      }
    });
  }
};

/**
 * Record file access
 * POST /api/atlas/agents/:agentId/file-access
 */
export const recordFileAccess = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const accessData = req.body;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    // Check permission first
    const hasPermission = await agentFileAccessService.checkFilePermission(
      agentId,
      accessData.fileId,
      accessData.accessType
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Agent does not have permission to access this file'
        }
      });
    }

    const accessRecord = await agentFileAccessService.recordFileAccess({
      agentId,
      ...accessData
    });

    res.status(201).json({
      success: true,
      data: accessRecord
    });
  } catch (error) {
    logger.error('Error recording file access:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to record file access'
      }
    });
  }
};

/**
 * Grant file permission to an agent
 * POST /api/atlas/agents/:agentId/file-permissions
 */
export const grantFilePermission = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const permissionData = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    const permission = await agentFileAccessService.grantFilePermission({
      agentId,
      grantedBy: userId,
      ...permissionData
    });

    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    logger.error('Error granting file permission:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to grant file permission'
      }
    });
  }
};

/**
 * Revoke file permission
 * DELETE /api/atlas/file-permissions/:permissionId
 */
export const revokeFilePermission = async (req: Request, res: Response) => {
  try {
    const { permissionId } = req.params;

    const permission = await agentFileAccessService.revokeFilePermission(permissionId);

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    logger.error('Error revoking file permission:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to revoke file permission'
      }
    });
  }
};

/**
 * Get agent file permissions
 * GET /api/atlas/agents/:agentId/file-permissions
 */
export const getAgentPermissions = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { activeOnly } = req.query;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    const permissions = await agentFileAccessService.getAgentPermissions(
      agentId,
      activeOnly !== 'false'
    );

    res.json({
      success: true,
      data: {
        agentId,
        permissions,
        count: permissions.length
      }
    });
  } catch (error) {
    logger.error('Error getting agent permissions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get agent permissions'
      }
    });
  }
};

/**
 * Get file operations for an agent
 * GET /api/atlas/agents/:agentId/file-operations
 */
export const getAgentFileOperations = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { operationType, projectId, limit, offset } = req.query;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    const filters: any = {};
    if (operationType) filters.operationType = operationType;
    if (projectId) filters.projectId = projectId;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const operations = await agentFileAccessService.getAgentFileOperations(agentId, filters);

    res.json({
      success: true,
      data: {
        agentId,
        operations,
        count: operations.length
      }
    });
  } catch (error) {
    logger.error('Error getting agent file operations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get agent file operations'
      }
    });
  }
};

/**
 * Record file operation
 * POST /api/atlas/agents/:agentId/file-operations
 */
export const recordFileOperation = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const operationData = req.body;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    // If there's a fileId and it's not a create operation, check permissions
    if (operationData.fileId && operationData.operationType !== 'create') {
      const accessTypeMap: any = {
        update: 'write',
        delete: 'delete',
        move: 'write',
        copy: 'read'
      };
      
      const requiredAccess = accessTypeMap[operationData.operationType] || 'write';
      const hasPermission = await agentFileAccessService.checkFilePermission(
        agentId,
        operationData.fileId,
        requiredAccess
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Agent does not have permission to perform this operation'
          }
        });
      }
    }

    const operation = await agentFileAccessService.recordFileOperation({
      agentId,
      ...operationData
    });

    res.status(201).json({
      success: true,
      data: operation
    });
  } catch (error) {
    logger.error('Error recording file operation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to record file operation'
      }
    });
  }
};

/**
 * Get agent file access statistics
 * GET /api/atlas/agents/:agentId/file-access/stats
 */
export const getAgentFileAccessStats = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify agent exists
    await agentOrchestratorService.getAgent(agentId);

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await agentFileAccessService.getAgentFileAccessStats(agentId, start, end);

    res.json({
      success: true,
      data: {
        agentId,
        stats,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  } catch (error) {
    logger.error('Error getting agent file access stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get agent file access statistics'
      }
    });
  }
};
