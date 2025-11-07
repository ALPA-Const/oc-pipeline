import express, { Router } from 'express';
import { login, signup, logout, getSession, googleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', authenticate, logout);
router.get('/session', authenticate, getSession);
router.post('/google', googleAuth);

export default router;
