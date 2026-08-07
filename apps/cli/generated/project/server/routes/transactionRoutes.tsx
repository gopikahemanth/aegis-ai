import { Router } from 'express';
import { createTransaction, getTransactions } from '../controllers/transactionController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.post('/', authGuard, createTransaction);
router.get('/', authGuard, getTransactions);

export default router;