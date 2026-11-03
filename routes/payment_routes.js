const express = require('express');
const router = express.Router();

const PaymentController = require('../controllers/payment_controller');

// Get all payments
router.get('/', PaymentController.getAll);

// Get one payment
router.get('/:id', PaymentController.getById);

// Void a payment
router.put('/:id/void', PaymentController.voidPayment);

module.exports = router;