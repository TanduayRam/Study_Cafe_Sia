const express = require('express');
const router = express.Router();

const billingController = require('../controllers/billing_controller');

// Calculate reservation bill
router.get(
    '/compute/:reservationId',
    billingController.computeBill
);

module.exports = router;