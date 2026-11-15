const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth_middleware');

// View all orders: Admin and Staff
router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    orderController.getAll
);

// View one order: Admin and Staff
router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    orderController.getById
);

// Create an order: Admin and Staff
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    orderController.create
);

// Update order status: Admin and Staff
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    orderController.updateStatus
);

 module.exports = router;