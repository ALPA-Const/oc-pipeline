import express from 'express';
import specificationController from '../controllers/specificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Specification Routes
 * Base path: /api/specifications
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/specifications
 * @desc    List all specifications for a project
 * @access  Private
 * @query   project_id, division, status, page, limit
 */
router.get('/', specificationController.listSpecifications.bind(specificationController));

/**
 * @route   GET /api/specifications/:id
 * @desc    Get single specification with details
 * @access  Private
 */
router.get('/:id', specificationController.getSpecification.bind(specificationController));

/**
 * @route   POST /api/specifications/upload
 * @desc    Upload specification document
 * @access  Private
 * @body    project_id, document_name, file_path, section_number, section_title, division, etc.
 */
router.post('/upload', specificationController.uploadSpecification.bind(specificationController));

/**
 * @route   DELETE /api/specifications/:id
 * @desc    Delete specification
 * @access  Private
 */
router.delete('/:id', specificationController.deleteSpecification.bind(specificationController));

/**
 * @route   POST /api/specifications/:id/extract
 * @desc    Extract submittals from specification using AI
 * @access  Private
 */
router.post('/:id/extract', specificationController.extractSubmittals.bind(specificationController));

/**
 * @route   POST /api/specifications/:id/create-submittals
 * @desc    Create submittals from AI extraction
 * @access  Private
 * @body    extraction_id, selected_submittals (optional)
 */
router.post('/:id/create-submittals', specificationController.createSubmittalsFromExtraction.bind(specificationController));

export default router;