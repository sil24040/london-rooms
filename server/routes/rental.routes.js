const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/rental.controller');
 
router.post('/set', authRequired, ctrl.setRental);
router.get('/mine', authRequired, ctrl.myRental);
router.post('/pay', authRequired, ctrl.payRent);
router.delete('/pay/:id', authRequired, ctrl.deletePayment);
 
module.exports = router;
 