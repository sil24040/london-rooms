const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/reviews.controller');

router.post('/:roomId', authRequired, ctrl.createOrUpdateReview);
router.get('/room/:roomId', ctrl.getRoomReviews);
router.get('/eligibility/:roomId', authRequired, ctrl.reviewEligibility);
router.get('/mine/:roomId', authRequired, ctrl.myReview);
router.delete('/:id', authRequired, ctrl.deleteReview);

module.exports = router;
