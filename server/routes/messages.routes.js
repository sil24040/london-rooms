const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/messages.controller');

router.get('/unread', authRequired, ctrl.unreadCount);
router.get('/:id/messages', authRequired, ctrl.getMessages);
router.post('/:id/messages', authRequired, ctrl.sendMessage);

module.exports = router;
