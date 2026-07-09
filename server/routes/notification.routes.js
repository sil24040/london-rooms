const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.get('/', authRequired, ctrl.myNotifications);
router.put('/:id/read', authRequired, ctrl.markRead);
router.put('/read-all', authRequired, ctrl.markAllRead);

module.exports = router;