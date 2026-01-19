import express, { Router } from 'express';
import { getProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/projectsController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

export default router;
