import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/offers.controller';

const router: Router = express.Router();

router.get('/mine', authRequired, ctrl.myOffers);
router.get('/sent', authRequired, ctrl.sentOffers);
router.post('/', authRequired, ctrl.createOffer);
router.put('/:id', authRequired, ctrl.respondOffer);

export default router;