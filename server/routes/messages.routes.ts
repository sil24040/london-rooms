import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/messages.controller';

const router: Router = express.Router();

router.get('/unread', authRequired, ctrl.unreadCount);
router.get('/:id/messages', authRequired, ctrl.getMessages);
router.post('/:id/messages', authRequired, ctrl.sendMessage);

export default router;