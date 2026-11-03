const express = require('express');
const router = express.Router();

const checkoutController = require('../controllers/checkout_controller');

// Process reservation checkout
router.post('/:reservationId', checkoutController.checkoutReservation);

module.exports = router;