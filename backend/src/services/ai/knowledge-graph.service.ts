import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * KnowledgeGraphService
 * 
 * Manages the knowledge graph for storing and querying relationships
 * between entities, concepts, and data in the ATLAS system.
 */
class KnowledgeGraphService {
  constructor() {
    this.db = pool;
  }

  /**
   * Create a new node in the knowledge graph
   * @param {string} workspaceId - Workspace UUID
   * @param {string} nodeType - Type of node (entity, concept, document, etc.)
   * @param {string} label - Human-readable label
   * @param {Object} properties - Node properties
   * @returns {Promise<Object>} Created node
   */
  async createNode(workspaceId, nodeType, label, properties = {}) {
    try {
      const result = await this.db.query(
        `INSERT INTO knowledge_nodes (workspace_id, node_type, label, properties)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [workspaceId, nodeType, label, properties]
      );

      logger.info('Knowledge node created', { 
        nodeId: result.rows[0].node_id,
        nodeType,
        label 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating knowledge node:', { 
        workspaceId, 
        nodeType, 
        label, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get a node by ID
   * @param {string} nodeId - Node UUID
   * @returns {Promise<Object>} Node object
   */
  async getNode(nodeId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM knowledge_nodes WHERE node_id = $1 AND deleted_at IS NULL',
        [nodeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting node:', { nodeId, error: error.message });
      throw error;
    }
  }

  /**
   * Update node properties
   * @param {string} nodeId - Node UUID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated node
   */
  async updateNode(nodeId, properties) {
    try {
      const result = await this.db.query(
        `UPDATE knowledge_nodes 
         SET properties = properties || $1::jsonb,
             updated_at = NOW()
         WHERE node_id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [properties, nodeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      logger.info('Knowledge node updated', { nodeId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating node:', { nodeId, error: error.message });
      throw error;
    }
  }

  /**
   * Soft delete a node
   * @param {string} nodeId - Node UUID
   * @returns {Promise<void>}
   */
  async deleteNode(nodeId) {
    try {
      const result = await this.db.query(
        `UPDATE knowledge_nodes 
         SET deleted_at = NOW()
         WHERE node_id = $1 AND deleted_at IS NULL
         RETURNING node_id`,
        [nodeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      logger.info('Knowledge node deleted', { nodeId });
    } catch (error) {
      logger.error('Error deleting node:', { nodeId, error: error.message });
      throw error;
    }
  }

  /**
   * Create an edge (relationship) between nodes
   * @param {string} sourceId - Source node UUID
   * @param {string} targetId - Target node UUID
   * @param {string} relationshipType - Type of relationship
   * @param {Object} properties - Edge properties
   * @param {number} weight - Edge weight (default 1.0)
   * @returns {Promise<Object>} Created edge
   */
  async createEdge(sourceId, targetId, relationshipType, properties = {}, weight = 1.0) {
    try {
      // Verify both nodes exist
      await this.getNode(sourceId);
      await this.getNode(targetId);

      const result = await this.db.query(
        `INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, properties, weight)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [sourceId, targetId, relationshipType, properties, weight]
      );

      logger.info('Knowledge edge created', { 
        edgeId: result.rows[0].edge_id,
        sourceId,
        targetId,
        relationshipType 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating edge:', { 
        sourceId, 
        targetId, 
        relationshipType, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get edges for a node
   * @param {string} nodeId - Node UUID
   * @param {string} direction - 'incoming', 'outgoing', or 'both'
   * @returns {Promise<Array>} Array of edges
   */
  async getEdges(nodeId, direction = 'both') {
    try {
      let query = `
        SELECT e.*, 
               sn.label as source_label, sn.node_type as source_type,
               tn.label as target_label, tn.node_type as target_type
        FROM knowledge_edges e
        JOIN knowledge_nodes sn ON e.source_node_id = sn.node_id
        JOIN knowledge_nodes tn ON e.target_node_id = tn.node_id
        WHERE 1=1
      `;

      const params = [nodeId];

      if (direction === 'outgoing') {
        query += ' AND e.source_node_id = $1';
      } else if (direction === 'incoming') {
        query += ' AND e.target_node_id = $1';
      } else {
        query += ' AND (e.source_node_id = $1 OR e.target_node_id = $1)';
      }

      query += ' ORDER BY e.weight DESC, e.created_at DESC';

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting edges:', { nodeId, direction, error: error.message });
      throw error;
    }
  }

  /**
   * Delete an edge
   * @param {string} edgeId - Edge UUID
   * @returns {Promise<void>}
   */
  async deleteEdge(edgeId) {
    try {
      const result = await this.db.query(
        'DELETE FROM knowledge_edges WHERE edge_id = $1 RETURNING edge_id',
        [edgeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Edge not found: ${edgeId}`);
      }

      logger.info('Knowledge edge deleted', { edgeId });
    } catch (error) {
      logger.error('Error deleting edge:', { edgeId, error: error.message });
      throw error;
    }
  }

  /**
   * Find path between two nodes using BFS
   * @param {string} fromNodeId - Starting node UUID
   * @param {string} toNodeId - Target node UUID
   * @param {number} maxDepth - Maximum path length (default 5)
   * @returns {Promise<Array|null>} Path as array of nodes, or null if no path found
   */
  async findPath(fromNodeId, toNodeId, maxDepth = 5) {
    try {
      // Use recursive CTE to find path
      const result = await this.db.query(
        `WITH RECURSIVE path_search AS (
          -- Base case: start node
          SELECT 
            source_node_id as node_id,
            target_node_id as next_node_id,
            ARRAY[source_node_id] as path,
            1 as depth
          FROM knowledge_edges
          WHERE source_node_id = $1
          
          UNION ALL
          
          -- Recursive case: follow edges
          SELECT 
            e.source_node_id,
            e.target_node_id,
            ps.path || e.source_node_id,
            ps.depth + 1
          FROM knowledge_edges e
          JOIN path_search ps ON e.source_node_id = ps.next_node_id
          WHERE ps.depth < $3
            AND NOT (e.source_node_id = ANY(ps.path)) -- Avoid cycles
        )
        SELECT path || next_node_id as full_path
        FROM path_search
        WHERE next_node_id = $2
        ORDER BY array_length(path, 1)
        LIMIT 1`,
        [fromNodeId, toNodeId, maxDepth]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Fetch node details for the path
      const pathNodeIds = result.rows[0].full_path;
      const nodes = await this.db.query(
        'SELECT * FROM knowledge_nodes WHERE node_id = ANY($1) ORDER BY array_position($1, node_id)',
        [pathNodeIds]
      );

      return nodes.rows;
    } catch (error) {
      logger.error('Error finding path:', { fromNodeId, toNodeId, error: error.message });
      throw error;
    }
  }

  /**
   * Get neighbors within N hops
   * @param {string} nodeId - Starting node UUID
   * @param {number} depth - Number of hops (default 1)
   * @returns {Promise<Array>} Array of neighbor nodes
   */
  async getNeighbors(nodeId, depth = 1) {
    try {
      const result = await this.db.query(
        `WITH RECURSIVE neighbors AS (
          -- Base case: direct neighbors
          SELECT DISTINCT
            CASE 
              WHEN source_node_id = $1 THEN target_node_id
              ELSE source_node_id
            END as neighbor_id,
            1 as hop_distance
          FROM knowledge_edges
          WHERE source_node_id = $1 OR target_node_id = $1
          
          UNION
          
          -- Recursive case: neighbors of neighbors
          SELECT DISTINCT
            CASE 
              WHEN e.source_node_id = n.neighbor_id THEN e.target_node_id
              ELSE e.source_node_id
            END as neighbor_id,
            n.hop_distance + 1
          FROM knowledge_edges e
          JOIN neighbors n ON (e.source_node_id = n.neighbor_id OR e.target_node_id = n.neighbor_id)
          WHERE n.hop_distance < $2
            AND CASE 
              WHEN e.source_node_id = n.neighbor_id THEN e.target_node_id
              ELSE e.source_node_id
            END != $1
        )
        SELECT DISTINCT kn.*, n.hop_distance
        FROM neighbors n
        JOIN knowledge_nodes kn ON n.neighbor_id = kn.node_id
        WHERE kn.deleted_at IS NULL
        ORDER BY n.hop_distance, kn.created_at DESC`,
        [nodeId, depth]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting neighbors:', { nodeId, depth, error: error.message });
      throw error;
    }
  }

  /**
   * Search nodes by label or properties
   * @param {string} workspaceId - Workspace UUID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching nodes
   */
  async searchNodes(workspaceId, query) {
    try {
      const result = await this.db.query(
        `SELECT *, 
                ts_rank(to_tsvector('english', label || ' ' || COALESCE(properties::text, '')), 
                        plainto_tsquery('english', $2)) as rank
         FROM knowledge_nodes
         WHERE workspace_id = $1
           AND deleted_at IS NULL
           AND (
             label ILIKE $3
             OR to_tsvector('english', label || ' ' || COALESCE(properties::text, '')) @@ plainto_tsquery('english', $2)
           )
         ORDER BY rank DESC, created_at DESC
         LIMIT 50`,
        [workspaceId, query, `%${query}%`]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error searching nodes:', { workspaceId, query, error: error.message });
      throw error;
    }
  }

  /**
   * Get all nodes of a specific type
   * @param {string} workspaceId - Workspace UUID
   * @param {string} nodeType - Node type
   * @returns {Promise<Array>} Array of nodes
   */
  async getNodesByType(workspaceId, nodeType) {
    try {
      const result = await this.db.query(
        `SELECT * FROM knowledge_nodes
         WHERE workspace_id = $1
           AND node_type = $2
           AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [workspaceId, nodeType]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting nodes by type:', { workspaceId, nodeType, error: error.message });
      throw error;
    }
  }

  /**
   * Store agent memory
   * @param {string} agentId - Agent UUID
   * @param {string} memoryType - Type of memory (short_term, long_term, episodic, semantic)
   * @param {string} key - Memory key
   * @param {*} value - Memory value
   * @param {number} ttl - Time to live in seconds (null for no expiration)
   * @returns {Promise<Object>} Created memory entry
   */
  async storeMemory(agentId, memoryType, key, value, ttl = null) {
    try {
      const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;

      const result = await this.db.query(
        `INSERT INTO agent_memory (agent_id, memory_type, key, value, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (agent_id, key) 
         DO UPDATE SET 
           value = EXCLUDED.value,
           memory_type = EXCLUDED.memory_type,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW()
         RETURNING *`,
        [agentId, memoryType, key, value, expiresAt]
      );

      logger.debug('Agent memory stored', { agentId, memoryType, key });
      return result.rows[0];
    } catch (error) {
      logger.error('Error storing memory:', { agentId, memoryType, key, error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve agent memory
   * @param {string} agentId - Agent UUID
   * @param {string} key - Memory key
   * @returns {Promise<*>} Memory value or null
   */
  async retrieveMemory(agentId, key) {
    try {
      const result = await this.db.query(
        `SELECT value FROM agent_memory
         WHERE agent_id = $1 
           AND key = $2
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [agentId, key]
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.debug('Agent memory retrieved', { agentId, key });
      return result.rows[0].value;
    } catch (error) {
      logger.error('Error retrieving memory:', { agentId, key, error: error.message });
      throw error;
    }
  }

  /**
   * Clear expired memory entries
   * @returns {Promise<number>} Number of entries deleted
   */
  async clearExpiredMemory() {
    try {
      const result = await this.db.query(
        `DELETE FROM agent_memory
         WHERE expires_at IS NOT NULL 
           AND expires_at <= NOW()
         RETURNING memory_id`
      );

      const count = result.rows.length;
      if (count > 0) {
        logger.info('Expired memory entries cleared', { count });
      }

      return count;
    } catch (error) {
      logger.error('Error clearing expired memory:', { error: error.message });
      throw error;
    }
  }
}

export default new KnowledgeGraphService();