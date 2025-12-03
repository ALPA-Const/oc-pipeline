import express from 'express';
import submittalController from '../controllers/submittalController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Submittal Routes
 * Base path: /api/submittals
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/submittals
 * @desc    List all submittals for a project
 * @access  Private
 * @query   project_id, status, type, spec_section, priority, assigned_to, page, limit, sort
 */
router.get('/', submittalController.listSubmittals.bind(submittalController));

/**
 * @route   GET /api/submittals/export
 * @desc    Export submittals to Excel
 * @access  Private
 * @query   project_id
 */
router.get('/export', submittalController.exportToExcel.bind(submittalController));

/**
 * @route   GET /api/submittals/:id
 * @desc    Get single submittal with details
 * @access  Private
 */
router.get('/:id', submittalController.getSubmittal.bind(submittalController));

/**
 * @route   POST /api/submittals
 * @desc    Create new submittal
 * @access  Private
 * @body    project_id, submittal_number, spec_section, submittal_title, submittal_type, etc.
 */
router.post('/', submittalController.createSubmittal.bind(submittalController));

/**
 * @route   PATCH /api/submittals/:id
 * @desc    Update submittal
 * @access  Private
 * @body    Any updateable fields
 */
router.patch('/:id', submittalController.updateSubmittal.bind(submittalController));

/**
 * @route   PATCH /api/submittals/:id/status
 * @desc    Update submittal status (workflow transition)
 * @access  Private
 * @body    status, comments
 */
router.patch('/:id/status', submittalController.updateStatus.bind(submittalController));

/**
 * @route   DELETE /api/submittals/:id
 * @desc    Delete submittal
 * @access  Private
 */
router.delete('/:id', submittalController.deleteSubmittal.bind(submittalController));

export default router;