import pool from '../config/database';
import logger from '../utils/logger';
import aiExtractionService from '../services/aiExtractionService';

/**
 * Specification Controller
 * 
 * Handles specification document uploads and AI-powered extraction
 * 
 * FIXED: Uses submittals_isdc, submittal_items_isdc instead of submittals, submittal_items
 */
class SpecificationController {
  /**
   * Upload specification document
   * POST /api/specifications/upload
   */
  async uploadSpecification(req, res) {
    try {
      const {
        project_id,
        document_name,
        document_type = 'specification',
        division,
        section_number,
        section_title,
        file_path
      } = req.body;

      if (!project_id || !document_name || !file_path) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: project_id, document_name, file_path'
          }
        });
      }

      const query = `
        INSERT INTO specifications (
          project_id, document_name, document_type, division,
          section_number, section_title, file_path, file_size_bytes,
          uploaded_by, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        project_id,
        document_name,
        document_type,
        division,
        section_number,
        section_title,
        file_path,
        req.body.file_size_bytes || 0,
        req.user.id,
        'pending'
      ]);

      const specification = result.rows[0];

      logger.info('Specification uploaded', {
        specId: specification.id,
        projectId: project_id,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: { specification }
      });
    } catch (error) {
      logger.error('Error uploading specification:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload specification'
        }
      });
    }
  }

  /**
   * List specifications for a project
   * GET /api/specifications?project_id=uuid
   */
  async listSpecifications(req, res) {
    try {
      const { project_id, processing_status } = req.query;

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
          s.*,
          u.full_name as uploaded_by_name,
          (SELECT COUNT(*) FROM ai_extractions 
           WHERE source_document_id = s.id AND source_table = 'specifications') as extraction_count
        FROM specifications s
        LEFT JOIN users u ON s.uploaded_by = u.id
        WHERE s.project_id = $1
      `;

      const params = [project_id];

      if (processing_status) {
        query += ' AND s.processing_status = $2';
        params.push(processing_status);
      }

      query += ' ORDER BY s.upload_date DESC';

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: { specifications: result.rows }
      });
    } catch (error) {
      logger.error('Error listing specifications:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve specifications'
        }
      });
    }
  }

  /**
   * Get specification details
   * GET /api/specifications/:id
   */
  async getSpecification(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.*,
          u.full_name as uploaded_by_name,
          u.email as uploaded_by_email
        FROM specifications s
        LEFT JOIN users u ON s.uploaded_by = u.id
        WHERE s.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Specification not found'
          }
        });
      }

      const extractionsQuery = `
        SELECT * FROM ai_extractions
        WHERE source_document_id = $1 AND source_table = 'specifications'
        ORDER BY created_at DESC
      `;
      const extractionsResult = await pool.query(extractionsQuery, [id]);

      res.json({
        success: true,
        data: {
          specification: result.rows[0],
          extractions: extractionsResult.rows
        }
      });
    } catch (error) {
      logger.error('Error getting specification:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve specification'
        }
      });
    }
  }

  /**
   * Run AI extraction on specification
   * POST /api/specifications/:id/extract
   */
  async extractSubmittals(req, res) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { id } = req.params;

      const specResult = await client.query(
        'SELECT * FROM specifications WHERE id = $1',
        [id]
      );

      if (specResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Specification not found'
          }
        });
      }

      const specification = specResult.rows[0];

      await client.query(
        'UPDATE specifications SET processing_status = $1 WHERE id = $2',
        ['processing', id]
      );

      const extractionResult = await aiExtractionService.extractSubmittalsFromSpec(
        specification.file_path,
        specification.project_id,
        specification.id
      );

      const extractionQuery = `
        INSERT INTO ai_extractions (
          project_id, source_document_id, source_table, extraction_type,
          extracted_data, confidence_score, ai_model, processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const extractionRecord = await client.query(extractionQuery, [
        specification.project_id,
        specification.id,
        'specifications',
        'submittal_requirement',
        JSON.stringify(extractionResult.submittals),
        extractionResult.metadata.averageConfidence,
        extractionResult.metadata.modelVersion,
        extractionResult.metadata.processingTimeMs
      ]);

      await client.query(
        `UPDATE specifications 
         SET processing_status = $1, 
             ai_processed_at = NOW(),
             ai_confidence_score = $2
         WHERE id = $3`,
        ['completed', extractionResult.metadata.averageConfidence, id]
      );

      await client.query('COMMIT');

      logger.info('AI extraction completed', {
        specId: id,
        submittalsFound: extractionResult.submittals.length,
        averageConfidence: extractionResult.metadata.averageConfidence
      });

      res.json({
        success: true,
        data: {
          extraction: extractionRecord.rows[0],
          submittals: extractionResult.submittals,
          metadata: extractionResult.metadata
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');

      await pool.query(
        'UPDATE specifications SET processing_status = $1 WHERE id = $2',
        ['failed', req.params.id]
      );

      logger.error('Error extracting submittals:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to extract submittals from specification'
        }
      });
    } finally {
      client.release();
    }
  }

  /**
   * Create submittals from AI extraction
   * POST /api/specifications/:id/create-submittals
   */
  async createSubmittalsFromExtraction(req, res) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { extraction_id, selected_submittals } = req.body;

      if (!extraction_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'extraction_id is required'
          }
        });
      }

      const extractionResult = await client.query(
        'SELECT * FROM ai_extractions WHERE id = $1',
        [extraction_id]
      );

      if (extractionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Extraction not found'
          }
        });
      }

      const extraction = extractionResult.rows[0];
      const submittals = extraction.extracted_data;

      const submittalsToCreate = selected_submittals 
        ? submittals.filter((_, index) => selected_submittals.includes(index))
        : submittals;

      const createdSubmittals: any[] = [];

      for (const submittalData of submittalsToCreate) {
        const submittalQuery = `
          INSERT INTO submittals_isdc (
            project_id, submittal_number, spec_section, submittal_title,
            submittal_type, description, priority, source_type,
            source_document_id, ai_extracted, ai_confidence_score,
            is_long_lead, is_critical_path, buy_american_required,
            created_by, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *
        `;

        const submittalResult = await client.query(submittalQuery, [
          extraction.project_id,
          submittalData.submittal_number || `AI-${Date.now()}`,
          submittalData.spec_section,
          submittalData.submittal_title,
          submittalData.submittal_type,
          submittalData.description,
          submittalData.priority || 'normal',
          'spec_ai',
          id,
          true,
          submittalData.ai_confidence_score,
          submittalData.is_long_lead || false,
          submittalData.is_critical_path || false,
          submittalData.buy_american_required || false,
          req.user.id,
          'not_started'
        ]);

        const submittal = submittalResult.rows[0];
        createdSubmittals.push(submittal);

        await client.query(
          'UPDATE ai_extractions SET converted_to_submittal_id = $1, status = $2 WHERE id = $3',
          [submittal.id, 'converted', extraction_id]
        );

        if (submittalData.items && submittalData.items.length > 0) {
          for (const item of submittalData.items) {
            await client.query(
              `INSERT INTO submittal_items_isdc (
                submittal_id, item_number, product_name, manufacturer,
                model_number, quantity, unit, specification_reference
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                submittal.id,
                item.item_number,
                item.product_name,
                item.manufacturer,
                item.model_number,
                item.quantity,
                item.unit,
                item.specification_reference
              ]
            );
          }
        }
      }

      await client.query('COMMIT');

      logger.info('Submittals created from AI extraction', {
        specId: id,
        extractionId: extraction_id,
        count: createdSubmittals.length,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: {
          submittals: createdSubmittals,
          count: createdSubmittals.length
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating submittals from extraction:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create submittals from extraction'
        }
      });
    } finally {
      client.release();
    }
  }

  /**
   * Delete specification
   * DELETE /api/specifications/:id
   */
  async deleteSpecification(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM specifications WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Specification not found'
          }
        });
      }

      logger.info('Specification deleted', { specId: id, userId: req.user.id });

      res.json({
        success: true,
        data: { message: 'Specification deleted successfully' }
      });
    } catch (error) {
      logger.error('Error deleting specification:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete specification'
        }
      });
    }
  }
}

export default new SpecificationController();
