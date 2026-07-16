import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import * as ctrl from '../controllers/auth.controller';

const router: Router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authRequired, ctrl.me);
router.put('/profile', authRequired, ctrl.updateProfile);
router.delete('/account', authRequired, ctrl.deleteAccount);

export default router;