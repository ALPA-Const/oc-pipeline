import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * AgentOrchestratorService
 * 
 * Manages the lifecycle and coordination of AI agents in the ATLAS system.
 * Handles agent state transitions, task assignment, and module routing.
 */
class AgentOrchestratorService {
  constructor() {
    this.db = pool;
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object>} Agent object
   */
  async getAgent(agentId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting agent:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * List agents with optional filters
   * @param {Object} filters - Filter criteria
   * @param {string} filters.status - Agent status
   * @param {string} filters.module - Module name
   * @param {string} filters.type - Agent type
   * @returns {Promise<Array>} Array of agents
   */
  async listAgents(filters = {}) {
    try {
      let query = 'SELECT * FROM agents WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (filters.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.module) {
        query += ` AND module = $${paramCount}`;
        params.push(filters.module);
        paramCount++;
      }

      if (filters.type) {
        query += ` AND type = $${paramCount}`;
        params.push(filters.type);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error listing agents:', { filters, error: error.message });
      throw error;
    }
  }

  /**
   * Update agent status
   * @param {string} agentId - Agent UUID
   * @param {string} status - New status (DORMANT, INITIALIZING, ACTIVE, PAUSED, ERROR, TERMINATED)
   * @returns {Promise<Object>} Updated agent
   */
  async updateAgentStatus(agentId, status) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const validStatuses = ['DORMANT', 'INITIALIZING', 'ACTIVE', 'PAUSED', 'ERROR', 'TERMINATED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const result = await client.query(
        `UPDATE agents 
         SET status = $1, 
             state = jsonb_set(
               COALESCE(state, '{}'::jsonb),
               '{last_status_change}',
               to_jsonb(NOW())
             ),
             updated_at = NOW()
         WHERE agent_id = $2
         RETURNING *`,
        [status, agentId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      await client.query('COMMIT');

      logger.info('Agent status updated', { agentId, status });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating agent status:', { agentId, status, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Start an agent (DORMANT -> INITIALIZING -> ACTIVE)
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object>} Updated agent
   */
  async startAgent(agentId) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check current status
      const agent = await this.getAgent(agentId);
      
      if (agent.status === 'ACTIVE') {
        logger.warn('Agent already active', { agentId });
        return agent;
      }

      if (agent.status !== 'DORMANT' && agent.status !== 'PAUSED') {
        throw new Error(`Cannot start agent from status: ${agent.status}`);
      }

      // Transition to INITIALIZING
      await this.updateAgentStatus(agentId, 'INITIALIZING');

      // Perform initialization logic here (load config, connect resources, etc.)
      logger.info('Agent initializing', { agentId });

      // Transition to ACTIVE
      const activeAgent = await this.updateAgentStatus(agentId, 'ACTIVE');

      // Record heartbeat
      await this.recordHeartbeat(agentId);

      await client.query('COMMIT');

      logger.info('Agent started successfully', { agentId });
      return activeAgent;
    } catch (error) {
      await client.query('ROLLBACK');
      await this.updateAgentStatus(agentId, 'ERROR');
      logger.error('Error starting agent:', { agentId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Stop an agent (transition to TERMINATED)
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object>} Updated agent
   */
  async stopAgent(agentId) {
    try {
      // Cancel any pending tasks
      await this.db.query(
        `UPDATE agent_tasks 
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE agent_id = $1 AND status IN ('PENDING', 'IN_PROGRESS')`,
        [agentId]
      );

      const agent = await this.updateAgentStatus(agentId, 'TERMINATED');
      
      logger.info('Agent stopped', { agentId });
      return agent;
    } catch (error) {
      logger.error('Error stopping agent:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Pause an agent
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object>} Updated agent
   */
  async pauseAgent(agentId) {
    try {
      const agent = await this.getAgent(agentId);
      
      if (agent.status !== 'ACTIVE') {
        throw new Error(`Cannot pause agent from status: ${agent.status}`);
      }

      const pausedAgent = await this.updateAgentStatus(agentId, 'PAUSED');
      
      logger.info('Agent paused', { agentId });
      return pausedAgent;
    } catch (error) {
      logger.error('Error pausing agent:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Resume a paused agent
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Object>} Updated agent
   */
  async resumeAgent(agentId) {
    try {
      const agent = await this.getAgent(agentId);
      
      if (agent.status !== 'PAUSED') {
        throw new Error(`Cannot resume agent from status: ${agent.status}`);
      }

      const activeAgent = await this.updateAgentStatus(agentId, 'ACTIVE');
      await this.recordHeartbeat(agentId);
      
      logger.info('Agent resumed', { agentId });
      return activeAgent;
    } catch (error) {
      logger.error('Error resuming agent:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Assign a task to an agent
   * @param {string} agentId - Agent UUID
   * @param {Object} task - Task details
   * @param {string} task.type - Task type
   * @param {Object} task.payload - Task payload
   * @param {number} task.priority - Priority (1-10)
   * @returns {Promise<Object>} Created task
   */
  async assignTask(agentId, task) {
    try {
      const agent = await this.getAgent(agentId);
      
      if (agent.status !== 'ACTIVE') {
        throw new Error(`Cannot assign task to agent with status: ${agent.status}`);
      }

      const result = await this.db.query(
        `INSERT INTO agent_tasks (agent_id, type, payload, priority, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         RETURNING *`,
        [agentId, task.type, task.payload, task.priority || 5]
      );

      logger.info('Task assigned to agent', { 
        agentId, 
        taskId: result.rows[0].task_id,
        type: task.type 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning task:', { agentId, task, error: error.message });
      throw error;
    }
  }

  /**
   * Get tasks for an agent
   * @param {string} agentId - Agent UUID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Array of tasks
   */
  async getAgentTasks(agentId, status = null) {
    try {
      let query = 'SELECT * FROM agent_tasks WHERE agent_id = $1';
      const params = [agentId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY priority DESC, created_at ASC';

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting agent tasks:', { agentId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Mark a task as complete
   * @param {string} taskId - Task UUID
   * @param {Object} result - Task result
   * @returns {Promise<Object>} Updated task
   */
  async completeTask(taskId, result) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const taskResult = await client.query(
        `UPDATE agent_tasks 
         SET status = 'COMPLETED',
             result = $1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE task_id = $2
         RETURNING *`,
        [result, taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error(`Task not found: ${taskId}`);
      }

      await client.query('COMMIT');

      logger.info('Task completed', { taskId });
      return taskResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error completing task:', { taskId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record agent heartbeat
   * @param {string} agentId - Agent UUID
   * @returns {Promise<void>}
   */
  async recordHeartbeat(agentId) {
    try {
      await this.db.query(
        `UPDATE agents 
         SET last_heartbeat = NOW(),
             updated_at = NOW()
         WHERE agent_id = $1`,
        [agentId]
      );

      logger.debug('Heartbeat recorded', { agentId });
    } catch (error) {
      logger.error('Error recording heartbeat:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get the primary agent for a module
   * @param {string} moduleName - Module name
   * @returns {Promise<Object|null>} Agent object or null
   */
  async getModuleOwner(moduleName) {
    try {
      const result = await this.db.query(
        `SELECT * FROM agents 
         WHERE module = $1 
         AND status = 'ACTIVE'
         ORDER BY created_at ASC
         LIMIT 1`,
        [moduleName]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting module owner:', { moduleName, error: error.message });
      throw error;
    }
  }

  /**
   * Route a task to the appropriate agent
   * @param {Object} task - Task to route
   * @param {string} task.module - Target module
   * @param {string} task.type - Task type
   * @param {Object} task.payload - Task payload
   * @returns {Promise<Object>} Assigned task
   */
  async routeTask(task) {
    try {
      if (!task.module) {
        throw new Error('Task must specify a target module');
      }

      // Find the primary agent for the module
      const agent = await this.getModuleOwner(task.module);

      if (!agent) {
        throw new Error(`No active agent found for module: ${task.module}`);
      }

      // Assign the task
      const assignedTask = await this.assignTask(agent.agent_id, {
        type: task.type,
        payload: task.payload,
        priority: task.priority
      });

      logger.info('Task routed', { 
        module: task.module, 
        agentId: agent.agent_id,
        taskId: assignedTask.task_id 
      });

      return assignedTask;
    } catch (error) {
      logger.error('Error routing task:', { task, error: error.message });
      throw error;
    }
  }
}

export default new AgentOrchestratorService();