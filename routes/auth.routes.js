import { Router } from 'express';
import { register, login, logout, verifyEmail, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';
import { validateRegistration, validateLogin } from '../middlewares/validators.js';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', authMiddleware, logout);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


export default router;
