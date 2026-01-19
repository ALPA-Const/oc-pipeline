import pool from '../config/database';
import logger from '../utils/logger';
import aiExtractionService from '../services/aiExtractionService';

/**
 * Submittal Controller
 * 
 * Handles all submittal-related operations including CRUD, status workflow,
 * and integration with AI extraction service.
 * 
 * FIXED: Uses submittals_isdc, submittal_items_isdc, submittal_reviews_isdc, vendors
 */
class SubmittalController {
  /**
   * Get all submittals for a project
   * GET /api/submittals?project_id=uuid&status=active&type=product_data
   */
  async listSubmittals(req, res) {
    try {
      const { 
        project_id, 
        status, 
        submittal_type, 
        spec_section,
        priority,
        assigned_to,
        page = 1, 
        limit = 50,
        sort = '-created_at'
      } = req.query;

      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'project_id is required'
          }
        });
      }

      // Build dynamic query
      let query = `
        SELECT 
          s.*,
          u.full_name as assigned_to_name,
          r.full_name as reviewer_name,
          v.name as contractor_name,
          (SELECT COUNT(*) FROM submittal_items_isdc WHERE submittal_id = s.id) as item_count,
          (SELECT COUNT(*) FROM submittal_reviews_isdc WHERE submittal_id = s.id) as review_count
        FROM submittals_isdc s
        LEFT JOIN users u ON s.assigned_to = u.id
        LEFT JOIN users r ON s.reviewer_id = r.id
        LEFT JOIN vendors v ON s.responsible_contractor = v.id
        WHERE s.project_id = $1
      `;

      const params = [project_id];
      let paramCount = 2;

      if (status) {
        query += ` AND s.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (submittal_type) {
        query += ` AND s.submittal_type = $${paramCount}`;
        params.push(submittal_type);
        paramCount++;
      }

      if (spec_section) {
        query += ` AND s.spec_section = $${paramCount}`;
        params.push(spec_section);
        paramCount++;
      }

      if (priority) {
        query += ` AND s.priority = $${paramCount}`;
        params.push(priority);
        paramCount++;
      }

      if (assigned_to) {
        query += ` AND s.assigned_to = $${paramCount}`;
        params.push(assigned_to);
        paramCount++;
      }

      // Sorting
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      query += ` ORDER BY s.${sortField} ${sortOrder}`;

      // Pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM submittals_isdc 
        WHERE project_id = $1 
        ${status ? `AND status = '${status}'` : ''}
      `;
      const countResult = await pool.query(countQuery, [project_id]);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          submittals: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error listing submittals:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve submittals'
        }
      });
    }
  }

  /**
   * Get single submittal with full details
   * GET /api/submittals/:id
   */
  async getSubmittal(req, res) {
    try {
      const { id } = req.params;

      const submittalQuery = `
        SELECT 
          s.*,
          u.full_name as assigned_to_name,
          u.email as assigned_to_email,
          r.full_name as reviewer_name,
          r.email as reviewer_email,
          v.name as contractor_name,
          v.email as contractor_email,
          creator.full_name as created_by_name
        FROM submittals_isdc s
        LEFT JOIN users u ON s.assigned_to = u.id
        LEFT JOIN users r ON s.reviewer_id = r.id
        LEFT JOIN vendors v ON s.responsible_contractor = v.id
        LEFT JOIN users creator ON s.created_by = creator.id
        WHERE s.id = $1
      `;

      const submittalResult = await pool.query(submittalQuery, [id]);

      if (submittalResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Submittal not found'
          }
        });
      }

      const submittal = submittalResult.rows[0];

      // Get submittal items
      const itemsQuery = `
        SELECT * FROM submittal_items_isdc 
        WHERE submittal_id = $1 
        ORDER BY item_number
      `;
      const itemsResult = await pool.query(itemsQuery, [id]);

      // Get review history
      const reviewsQuery = `
        SELECT 
          sr.*,
          u.full_name as reviewer_name,
          u.email as reviewer_email
        FROM submittal_reviews_isdc sr
        LEFT JOIN users u ON sr.reviewer_id = u.id
        WHERE sr.submittal_id = $1
        ORDER BY sr.reviewed_at DESC
      `;
      const reviewsResult = await pool.query(reviewsQuery, [id]);

      res.json({
        success: true,
        data: {
          submittal,
          items: itemsResult.rows,
          reviews: reviewsResult.rows
        }
      });
    } catch (error) {
      logger.error('Error getting submittal:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve submittal'
        }
      });
    }
  }

  /**
   * Create new submittal
   * POST /api/submittals
   */
  async createSubmittal(req, res) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        project_id,
        submittal_number,
        spec_section,
        submittal_title,
        submittal_type,
        description,
        priority = 'normal',
        responsible_contractor,
        assigned_to,
        reviewer_id,
        required_date,
        is_long_lead = false,
        is_critical_path = false,
        buy_american_required = false,
        davis_bacon_applicable = false,
        items = []
      } = req.body;

      // Validation
      if (!project_id || !submittal_number || !spec_section || !submittal_title || !submittal_type) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        });
      }

      // Insert submittal
      const submittalQuery = `
        INSERT INTO submittals_isdc (
          project_id, submittal_number, spec_section, submittal_title,
          submittal_type, description, priority, responsible_contractor,
          assigned_to, reviewer_id, required_date, is_long_lead,
          is_critical_path, buy_american_required, davis_bacon_applicable,
          source_type, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const submittalResult = await client.query(submittalQuery, [
        project_id,
        submittal_number,
        spec_section,
        submittal_title,
        submittal_type,
        description,
        priority,
        responsible_contractor,
        assigned_to,
        reviewer_id,
        required_date,
        is_long_lead,
        is_critical_path,
        buy_american_required,
        davis_bacon_applicable,
        'manual',
        req.user.id,
        'not_started'
      ]);

      const submittal = submittalResult.rows[0];

      // Insert submittal items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO submittal_items_isdc (
              submittal_id, item_number, product_name, manufacturer,
              model_number, quantity, unit, specification_reference,
              drawing_reference, substitution_allowed, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              submittal.id,
              item.item_number,
              item.product_name,
              item.manufacturer,
              item.model_number,
              item.quantity,
              item.unit,
              item.specification_reference,
              item.drawing_reference,
              item.substitution_allowed ?? true,
              item.notes
            ]
          );
        }
      }

      await client.query('COMMIT');

      logger.info('Submittal created', {
        submittalId: submittal.id,
        projectId: project_id,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: { submittal }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      const err = error as any;
      logger.error('Error creating submittal:', { error: err instanceof Error ? err.message : String(err) });

      if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Submittal number already exists for this project'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create submittal'
        }
      });
    } finally {
      client.release();
    }
  }

  /**
   * Update submittal
   * PATCH /api/submittals/:id
   */
  async updateSubmittal(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build dynamic update query
      const allowedFields = [
        'submittal_title', 'description', 'priority', 'responsible_contractor',
        'assigned_to', 'reviewer_id', 'required_date', 'submitted_date',
        'reviewed_date', 'approved_date', 'is_long_lead', 'is_critical_path',
        'buy_american_required', 'davis_bacon_applicable'
      ];

      const setClause: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClause.push(`${key} = $${paramCount}`);
          params.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid fields to update'
          }
        });
      }

      params.push(id);
      const query = `
        UPDATE submittals_isdc 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Submittal not found'
          }
        });
      }

      logger.info('Submittal updated', { submittalId: id, userId: req.user.id });

      res.json({
        success: true,
        data: { submittal: result.rows[0] }
      });
    } catch (error) {
      logger.error('Error updating submittal:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update submittal'
        }
      });
    }
  }

  /**
   * Update submittal status (workflow transition)
   * PATCH /api/submittals/:id/status
   */
  async updateStatus(req, res) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { status, comments } = req.body;

      const validStatuses = [
        'not_started', 'in_progress', 'submitted', 'under_review',
        'approved', 'approved_as_noted', 'revise_resubmit', 'rejected',
        'for_record_only', 'void'
      ];

      if (!validStatuses.includes(status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status value'
          }
        });
      }

      // Update submittal status
      const updateQuery = `
        UPDATE submittals_isdc 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const result = await client.query(updateQuery, [status, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Submittal not found'
          }
        });
      }

      // Create audit log entry (if comments provided)
      if (comments) {
        await client.query(
          `INSERT INTO submittal_reviews_isdc (
            submittal_id, reviewer_id, reviewer_role, review_action, comments
          ) VALUES ($1, $2, $3, $4, $5)`,
          [id, req.user.id, 'contractor', status, comments]
        );
      }

      await client.query('COMMIT');

      logger.info('Submittal status updated', { 
        submittalId: id, 
        newStatus: status,
        userId: req.user.id 
      });

      res.json({
        success: true,
        data: { submittal: result.rows[0] }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating submittal status:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update submittal status'
        }
      });
    } finally {
      client.release();
    }
  }

  /**
   * Delete submittal
   * DELETE /api/submittals/:id
   */
  async deleteSubmittal(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM submittals_isdc WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Submittal not found'
          }
        });
      }

      logger.info('Submittal deleted', { submittalId: id, userId: req.user.id });

      res.json({
        success: true,
        data: { message: 'Submittal deleted successfully' }
      });
    } catch (error) {
      logger.error('Error deleting submittal:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete submittal'
        }
      });
    }
  }

  /**
   * Export submittals to Excel
   * GET /api/submittals/export?project_id=uuid
   */
  async exportToExcel(req, res) {
    try {
      const { project_id } = req.query;

      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'project_id is required'
          }
        });
      }

      const query = `
        SELECT 
          s.submittal_number,
          s.revision,
          s.spec_section,
          s.submittal_title,
          s.submittal_type,
          s.priority,
          s.status,
          s.required_date,
          s.submitted_date,
          s.approved_date,
          v.name as contractor,
          u.full_name as assigned_to,
          s.is_long_lead,
          s.is_critical_path
        FROM submittals_isdc s
        LEFT JOIN vendors v ON s.responsible_contractor = v.id
        LEFT JOIN users u ON s.assigned_to = u.id
        WHERE s.project_id = $1
        ORDER BY s.spec_section, s.submittal_number
      `;

      const result = await pool.query(query, [project_id]);

      // TODO: Implement actual Excel generation using a library like 'exceljs'
      // For now, return CSV format
      res.json({
        success: true,
        data: {
          submittals: result.rows,
          format: 'json',
          message: 'Excel export will be implemented with exceljs library'
        }
      });
    } catch (error) {
      logger.error('Error exporting submittals:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export submittals'
        }
      });
    }
  }
}

export default new SubmittalController();
