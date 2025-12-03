import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Closeout Controller
 * 
 * Handles closeout document tracking and subcontractor outreach
 * 
 * FIXED: Uses vendors instead of companies, submittals_isdc instead of submittals
 */
class CloseoutController {
  /**
   * Get closeout dashboard for a project
   * GET /api/closeout/dashboard?project_id=uuid
   */
  async getDashboard(req, res) {
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

      const statsQuery = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(*) FILTER (WHERE status = 'accepted') as completed,
          COUNT(*) FILTER (WHERE status = 'not_received') as pending,
          COUNT(*) FILTER (WHERE status IN ('requested', 'received', 'under_review')) as in_progress,
          COUNT(*) FILTER (WHERE status IN ('rejected', 'resubmit_required')) as issues,
          ROUND(
            (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            2
          ) as completion_percentage
        FROM closeout_documents
        WHERE project_id = $1
      `;

      const statsResult = await pool.query(statsQuery, [project_id]);
      const stats = statsResult.rows[0];

      const byTypeQuery = `
        SELECT 
          document_type,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'accepted') as completed
        FROM closeout_documents
        WHERE project_id = $1
        GROUP BY document_type
        ORDER BY count DESC
      `;

      const byTypeResult = await pool.query(byTypeQuery, [project_id]);

      const subcontractorQuery = `
        SELECT 
          v.id,
          v.name,
          COUNT(cd.id) as total_documents,
          COUNT(cd.id) FILTER (WHERE cd.status = 'accepted') as completed_documents,
          ROUND(
            (COUNT(cd.id) FILTER (WHERE cd.status = 'accepted')::DECIMAL / NULLIF(COUNT(cd.id), 0)) * 100,
            2
          ) as compliance_percentage,
          MAX(cd.received_date) as last_submission_date
        FROM vendors v
        LEFT JOIN closeout_documents cd ON v.id = cd.subcontractor_id AND cd.project_id = $1
        WHERE v.id IN (
          SELECT DISTINCT subcontractor_id FROM closeout_documents WHERE project_id = $1
        )
        GROUP BY v.id, v.name
        ORDER BY compliance_percentage DESC NULLS LAST
      `;

      const subcontractorResult = await pool.query(subcontractorQuery, [project_id]);

      const activityQuery = `
        SELECT 
          cd.id,
          cd.document_title,
          cd.document_type,
          cd.status,
          cd.received_date,
          cd.accepted_date,
          v.name as subcontractor_name
        FROM closeout_documents cd
        LEFT JOIN vendors v ON cd.subcontractor_id = v.id
        WHERE cd.project_id = $1
        ORDER BY cd.updated_at DESC
        LIMIT 10
      `;

      const activityResult = await pool.query(activityQuery, [project_id]);

      res.json({
        success: true,
        data: {
          statistics: stats,
          documentsByType: byTypeResult.rows,
          subcontractorCompliance: subcontractorResult.rows,
          recentActivity: activityResult.rows
        }
      });
    } catch (error) {
      logger.error('Error getting closeout dashboard:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve closeout dashboard'
        }
      });
    }
  }

  /**
   * List closeout documents
   * GET /api/closeout/documents?project_id=uuid
   */
  async listDocuments(req, res) {
    try {
      const { 
        project_id, 
        status, 
        document_type, 
        subcontractor_id,
        page = 1,
        limit = 50 
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

      let query = `
        SELECT 
          cd.*,
          v.name as subcontractor_name,
          v.email as subcontractor_email,
          s.submittal_number,
          s.submittal_title
        FROM closeout_documents cd
        LEFT JOIN vendors v ON cd.subcontractor_id = v.id
        LEFT JOIN submittals_isdc s ON cd.submittal_id = s.id
        WHERE cd.project_id = $1
      `;

      const params = [project_id];
      let paramCount = 2;

      if (status) {
        query += ` AND cd.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (document_type) {
        query += ` AND cd.document_type = $${paramCount}`;
        params.push(document_type);
        paramCount++;
      }

      if (subcontractor_id) {
        query += ` AND cd.subcontractor_id = $${paramCount}`;
        params.push(subcontractor_id);
        paramCount++;
      }

      query += ' ORDER BY cd.created_at DESC';

      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) FROM closeout_documents 
        WHERE project_id = $1
        ${status ? `AND status = '${status}'` : ''}
      `;
      const countResult = await pool.query(countQuery, [project_id]);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          documents: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error listing closeout documents:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve closeout documents'
        }
      });
    }
  }

  /**
   * Create closeout document requirement
   * POST /api/closeout/documents
   */
  async createDocument(req, res) {
    try {
      const {
        project_id,
        document_type,
        document_title,
        spec_section,
        subcontractor_id,
        responsible_contact,
        required = true,
        required_copies = 1,
        format_required = 'digital',
        warranty_duration_months
      } = req.body;

      if (!project_id || !document_type || !document_title) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        });
      }

      const query = `
        INSERT INTO closeout_documents (
          project_id, document_type, document_title, spec_section,
          subcontractor_id, responsible_contact, required, required_copies,
          format_required, warranty_duration_months, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await pool.query(query, [
        project_id,
        document_type,
        document_title,
        spec_section,
        subcontractor_id,
        responsible_contact,
        required,
        required_copies,
        format_required,
        warranty_duration_months,
        'not_received'
      ]);

      logger.info('Closeout document created', {
        documentId: result.rows[0].id,
        projectId: project_id,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: { document: result.rows[0] }
      });
    } catch (error) {
      logger.error('Error creating closeout document:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create closeout document'
        }
      });
    }
  }

  /**
   * Update closeout document
   * PATCH /api/closeout/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'document_title', 'status', 'received_date', 'accepted_date',
        'file_path', 'file_name', 'warranty_start_date', 'warranty_end_date',
        'responsible_contact'
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
        UPDATE closeout_documents 
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
            message: 'Closeout document not found'
          }
        });
      }

      logger.info('Closeout document updated', { documentId: id, userId: req.user.id });

      res.json({
        success: true,
        data: { document: result.rows[0] }
      });
    } catch (error) {
      logger.error('Error updating closeout document:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update closeout document'
        }
      });
    }
  }

  /**
   * Create subcontractor outreach campaign
   * POST /api/closeout/outreach
   */
  async createOutreach(req, res) {
    try {
      const {
        project_id,
        subcontractor_id,
        outreach_type = 'initial_request',
        subject,
        message_body,
        documents_requested
      } = req.body;

      if (!project_id || !subcontractor_id || !subject || !message_body) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        });
      }

      const query = `
        INSERT INTO closeout_outreach (
          project_id, subcontractor_id, outreach_type, subject,
          message_body, documents_requested, sent_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        project_id,
        subcontractor_id,
        outreach_type,
        subject,
        message_body,
        JSON.stringify(documents_requested || []),
        req.user.id,
        'draft'
      ]);

      logger.info('Closeout outreach created', {
        outreachId: result.rows[0].id,
        subcontractorId: subcontractor_id,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: { outreach: result.rows[0] }
      });
    } catch (error) {
      logger.error('Error creating outreach:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create outreach'
        }
      });
    }
  }

  /**
   * Send outreach email
   * POST /api/closeout/outreach/:id/send
   */
  async sendOutreach(req, res) {
    try {
      const { id } = req.params;

      const outreachResult = await pool.query(
        `SELECT co.*, v.email as subcontractor_email, v.name as subcontractor_name
         FROM closeout_outreach co
         LEFT JOIN vendors v ON co.subcontractor_id = v.id
         WHERE co.id = $1`,
        [id]
      );

      if (outreachResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Outreach not found'
          }
        });
      }

      const outreach = outreachResult.rows[0];

      const updateResult = await pool.query(
        `UPDATE closeout_outreach 
         SET status = 'sent', sent_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      logger.info('Closeout outreach sent', {
        outreachId: id,
        subcontractorEmail: outreach.subcontractor_email,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: {
          outreach: updateResult.rows[0],
          message: 'Email sending will be implemented with SendGrid/AWS SES'
        }
      });
    } catch (error) {
      logger.error('Error sending outreach:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send outreach'
        }
      });
    }
  }

  /**
   * Generate closeout package
   * GET /api/closeout/package?project_id=uuid
   */
  async generatePackage(req, res) {
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
          cd.*,
          v.name as subcontractor_name,
          s.submittal_number,
          s.spec_section
        FROM closeout_documents cd
        LEFT JOIN vendors v ON cd.subcontractor_id = v.id
        LEFT JOIN submittals_isdc s ON cd.submittal_id = s.id
        WHERE cd.project_id = $1 AND cd.status = 'accepted'
        ORDER BY cd.document_type, cd.spec_section
      `;

      const result = await pool.query(query, [project_id]);

      const packageByType = result.rows.reduce((acc: any, doc: any) => {
        if (!acc[doc.document_type]) {
          acc[doc.document_type] = [];
        }
        acc[doc.document_type].push(doc);
        return acc;
      }, {});

      logger.info('Closeout package generated', {
        projectId: project_id,
        documentCount: result.rows.length,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: {
          project_id,
          documents: result.rows,
          packageByType,
          totalDocuments: result.rows.length,
          generatedAt: new Date().toISOString(),
          message: 'PDF package generation will be implemented with PDFKit or similar'
        }
      });
    } catch (error) {
      logger.error('Error generating closeout package:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate closeout package'
        }
      });
    }
  }
}

export default new CloseoutController();
