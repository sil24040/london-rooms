const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/rooms.controller');
 
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
 
module.exports = router;
 