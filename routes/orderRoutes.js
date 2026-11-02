const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

// Get all orders
router.get('/', orderController.getAll);

// Get one order
router.get('/:id', orderController.getById);

// Create an order
router.post('/', orderController.create);
// Update order status
router.patch('/:id/status', orderController.updateStatus);

module.exports = router;
