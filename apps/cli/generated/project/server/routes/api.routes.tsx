import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as TransactionController from '../controllers/transaction.controller';
import * as AnalyticsController from '../controllers/analytics.controller';

const router = Router();

// Transactions
router.post('/transactions', authenticate, TransactionController.createTransaction);
router.get('/transactions', authenticate, TransactionController.getTransactions);
router.delete('/transactions/:id', authenticate, TransactionController.deleteTransaction);

// Analytics
router.get('/analytics/summary', authenticate, AnalyticsController.getDashboardSummary);

export default router;