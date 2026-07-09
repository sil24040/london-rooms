const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/booking.controller');

router.post('/:roomId', authRequired, ctrl.createBooking);
router.get('/mine', authRequired, ctrl.myBookings);
router.get('/received', authRequired, ctrl.receivedBookings);
router.put('/:id/approve', authRequired, ctrl.approveBooking);
router.put('/:id/reject', authRequired, ctrl.rejectBooking);
router.delete('/:id', authRequired, ctrl.cancelBooking);

module.exports = router;