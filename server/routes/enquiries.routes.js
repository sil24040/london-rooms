const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/enquiries.controller');
 
// NOTE: /mine and /received must be declared BEFORE the /:roomId and /:id
// routes, otherwise Express would treat "mine"/"received" as a param value.
router.get('/mine', authRequired, ctrl.myEnquiries);
router.get('/received', authRequired, ctrl.receivedEnquiries);
router.post('/:roomId', authRequired, ctrl.createEnquiry);
router.post('/:id/reply', authRequired, ctrl.replyEnquiry);
router.put('/:id', authRequired, ctrl.editEnquiry);
router.delete('/:id', authRequired, ctrl.deleteEnquiry);
 
module.exports = router;
