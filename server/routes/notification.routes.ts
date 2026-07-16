import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/notification.controller';

const router: Router = express.Router();

router.get('/', authRequired, ctrl.myNotifications);
router.put('/:id/read', authRequired, ctrl.markRead);
router.put('/read-all', authRequired, ctrl.markAllRead);

export default router;