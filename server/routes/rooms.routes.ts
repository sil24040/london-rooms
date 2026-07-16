import express, { Router } from 'express';
import { authRequired } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as ctrl from '../controllers/rooms.controller';

const router: Router = express.Router();

// NOTE: specific routes (/saved, /compare) must be declared BEFORE /:id
// otherwise Express would treat "saved" or "compare" as an :id value.
router.get('/', ctrl.getRooms);
router.get('/saved', authRequired, ctrl.getSavedRooms);
router.post('/compare', ctrl.compareRooms);
router.get('/:id', ctrl.getRoom);
router.post('/', authRequired, upload.single('image'), ctrl.createRoom);
router.put('/:id', authRequired, upload.single('image'), ctrl.updateRoom);
router.delete('/:id', authRequired, ctrl.deleteRoom);
router.post('/:id/save', authRequired, ctrl.toggleSaveRoom);

export default router;