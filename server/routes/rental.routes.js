const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/rental.controller');
 
router.post('/set', authRequired, ctrl.setRental);
router.get('/mine', authRequired, ctrl.myRental);
router.get('/payment-config', authRequired, ctrl.paymentConfig);
router.post('/pay/intent', authRequired, ctrl.createRentPaymentIntent);
router.post('/pay/confirm', authRequired, ctrl.confirmRentPayment);
router.delete('/pay/:id', authRequired, ctrl.deletePayment);
 
module.exports = router;
 
