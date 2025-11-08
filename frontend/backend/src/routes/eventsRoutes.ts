import express, { Router } from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from '../controllers/eventsController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEvent);
router.post('/', authenticate, createEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;
