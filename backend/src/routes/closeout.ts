import express from 'express';
import closeoutController from '../controllers/closeoutController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Closeout Routes
 * Base path: /api/closeout
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/closeout/dashboard
 * @desc    Get closeout dashboard for a project
 * @access  Private
 * @query   project_id
 */
router.get('/dashboard', closeoutController.getDashboard.bind(closeoutController));

/**
 * @route   GET /api/closeout/documents
 * @desc    List all closeout documents for a project
 * @access  Private
 * @query   project_id, document_type, status, subcontractor_id, page, limit
 */
router.get('/documents', closeoutController.listDocuments.bind(closeoutController));

/**
 * @route   POST /api/closeout/documents
 * @desc    Create new closeout document requirement
 * @access  Private
 * @body    project_id, document_type, document_title, spec_section, subcontractor_id, etc.
 */
router.post('/documents', closeoutController.createDocument.bind(closeoutController));

/**
 * @route   PATCH /api/closeout/documents/:id
 * @desc    Update closeout document
 * @access  Private
 * @body    document_title, status, received_date, accepted_date, file_path, etc.
 */
router.patch('/documents/:id', closeoutController.updateDocument.bind(closeoutController));

/**
 * @route   POST /api/closeout/outreach
 * @desc    Create subcontractor outreach campaign
 * @access  Private
 * @body    project_id, subcontractor_id, outreach_type, subject, message_body, documents_requested
 */
router.post('/outreach', closeoutController.createOutreach.bind(closeoutController));

/**
 * @route   POST /api/closeout/outreach/:id/send
 * @desc    Send outreach email
 * @access  Private
 */
router.post('/outreach/:id/send', closeoutController.sendOutreach.bind(closeoutController));

/**
 * @route   GET /api/closeout/package
 * @desc    Generate closeout package for project
 * @access  Private
 * @query   project_id
 */
router.get('/package', closeoutController.generatePackage.bind(closeoutController));

export default router;