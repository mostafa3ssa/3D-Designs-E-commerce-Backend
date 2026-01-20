import { Router } from 'express';
import { getPaymobPaymentKey, handlePaymobWebhook } from '../controllers/checkout.controller.js';
import { optionalAuthMiddleware } from '../middlewares/auth.middleware.js';


const router = Router();

router.post('/paymob-key', optionalAuthMiddleware, getPaymobPaymentKey);

router.post('/webhook', handlePaymobWebhook);

export default router;
