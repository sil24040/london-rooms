import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/booking.controller';

const router: Router = express.Router();

router.post('/:roomId', authRequired, ctrl.createBooking);
router.get('/mine', authRequired, ctrl.myBookings);
router.get('/received', authRequired, ctrl.receivedBookings);
router.put('/:id/approve', authRequired, ctrl.approveBooking);
router.put('/:id/reject', authRequired, ctrl.rejectBooking);
router.delete('/:id', authRequired, ctrl.cancelBooking);

export default router;