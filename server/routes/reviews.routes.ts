import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/reviews.controller';

const router: Router = express.Router();

router.post('/:roomId', authRequired, ctrl.createOrUpdateReview);
router.get('/room/:roomId', ctrl.getRoomReviews);
router.get('/eligibility/:roomId', authRequired, ctrl.reviewEligibility);
router.get('/mine/:roomId', authRequired, ctrl.myReview);
router.delete('/:id', authRequired, ctrl.deleteReview);

export default router;