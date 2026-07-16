import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/rental.controller';

const router: Router = express.Router();

router.post('/set', authRequired, ctrl.setRental);
router.get('/mine', authRequired, ctrl.myRental);
router.get('/payment-config', authRequired, ctrl.paymentConfig);
router.post('/pay/intent', authRequired, ctrl.createRentPaymentIntent);
router.post('/pay/confirm', authRequired, ctrl.confirmRentPayment);
router.delete('/pay/:id', authRequired, ctrl.deletePayment);

export default router;