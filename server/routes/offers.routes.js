const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/offers.controller');

router.get('/mine', authRequired, ctrl.myOffers);
router.get('/sent', authRequired, ctrl.sentOffers);
router.post('/', authRequired, ctrl.createOffer);
router.put('/:id', authRequired, ctrl.respondOffer);

module.exports = router;
