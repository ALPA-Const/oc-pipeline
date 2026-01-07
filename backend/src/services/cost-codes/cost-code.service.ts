/**
 * Cost Code Service
 * Manages cost codes with CSI MasterFormat, Uniformat II support
 */
import pool from '../../config/database';
import logger from '../../utils/logger';

export interface CostCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  level: number;
  standard_type: 'csi' | 'uniformat' | 'rsmeans' | 'custom';
  organization_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostCodeFilter {
  standard_type?: string;
  level?: number;
  parent_id?: string;
  search?: string;
  is_active?: boolean;
}

class CostCodeService {
  private db = pool;

  /**
   * List cost codes with filtering
   */
  async listCostCodes(filters: CostCodeFilter = {}, page = 1, limit = 50): Promise<{ data: CostCode[]; total: number }> {
    try {
      let query = 'SELECT * FROM cost_codes WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filters.standard_type) {
        query += ` AND standard_type = $${paramCount++}`;
        params.push(filters.standard_type);
      }
      if (filters.level !== undefined) {
        query += ` AND level = $${paramCount++}`;
        params.push(filters.level);
      }
      if (filters.parent_id) {
        query += ` AND parent_id = $${paramCount++}`;
        params.push(filters.parent_id);
      }
      if (filters.is_active !== undefined) {
        query += ` AND is_active = $${paramCount++}`;
        params.push(filters.is_active);
      }
      if (filters.search) {
        query += ` AND (code ILIKE $${paramCount} OR name ILIKE $${paramCount++})`;
        params.push(`%${filters.search}%`);
      }

      // Get total count
      const countResult = await this.db.query(
        query.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Add pagination
      query += ` ORDER BY code ASC LIMIT $${paramCount++} OFFSET $${paramCount}`;
      params.push(limit, (page - 1) * limit);

      const result = await this.db.query(query, params);
      return { data: result.rows, total };
    } catch (error: any) {
      logger.error('Error listing cost codes:', error.message);
      throw error;
    }
  }

  /**
   * Get cost code by ID
   */
  async getCostCode(id: string): Promise<CostCode | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM cost_codes WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Error getting cost code:', error.message);
      throw error;
    }
  }

  /**
   * Get cost code by code string
   */
  async getCostCodeByCode(code: string): Promise<CostCode | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM cost_codes WHERE code = $1',
        [code]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Error getting cost code by code:', error.message);
      throw error;
    }
  }


  /**
   * Create new cost code
   */
  async createCostCode(data: Partial<CostCode>): Promise<CostCode> {
    try {
      const result = await this.db.query(
        `INSERT INTO cost_codes (code, name, description, parent_id, level, standard_type, organization_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.code,
          data.name,
          data.description || null,
          data.parent_id || null,
          data.level || 1,
          data.standard_type || 'custom',
          data.organization_id || null,
          data.is_active !== false
        ]
      );
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating cost code:', error.message);
      throw error;
    }
  }

  /**
   * Update cost code
   */
  async updateCostCode(id: string, data: Partial<CostCode>): Promise<CostCode | null> {
    try {
      const fields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (data.name) { fields.push(`name = $${paramCount++}`); params.push(data.name); }
      if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); params.push(data.description); }
      if (data.is_active !== undefined) { fields.push(`is_active = $${paramCount++}`); params.push(data.is_active); }

      if (fields.length === 0) return this.getCostCode(id);

      fields.push(`updated_at = NOW()`);
      params.push(id);

      const result = await this.db.query(
        `UPDATE cost_codes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        params
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Error updating cost code:', error.message);
      throw error;
    }
  }

  /**
   * Delete cost code (soft delete)
   */
  async deleteCostCode(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'UPDATE cost_codes SET is_active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error deleting cost code:', error.message);
      throw error;
    }
  }

  /**
   * Get children of a cost code
   */
  async getChildren(parentId: string): Promise<CostCode[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM cost_codes WHERE parent_id = $1 AND is_active = true ORDER BY code',
        [parentId]
      );
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting children:', error.message);
      throw error;
    }
  }

  /**
   * Get hierarchy path for a cost code
   */
  async getHierarchy(id: string): Promise<CostCode[]> {
    try {
      const result = await this.db.query(
        `WITH RECURSIVE hierarchy AS (
          SELECT * FROM cost_codes WHERE id = $1
          UNION ALL
          SELECT cc.* FROM cost_codes cc
          JOIN hierarchy h ON cc.id = h.parent_id
        )
        SELECT * FROM hierarchy ORDER BY level`,
        [id]
      );
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting hierarchy:', error.message);
      throw error;
    }
  }
}

export const costCodeService = new CostCodeService();
export default costCodeService;
