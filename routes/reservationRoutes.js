const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');
const checkoutController = require('../controllers/checkout_controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth_middleware');

// View all reservations: Admin and Staff
router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    reservationController.getAll
);

// View a specific reservation: Admin, Staff, and Customer
router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'staff', 'customer'),
    reservationController.getById
);

// Create a reservation
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff', 'customer'),
    reservationController.create
);

// Update a reservation: Admin and Customer
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'customer'),
    reservationController.update
);

// Check in: Admin and Staff
router.post(
    '/:id/check-in',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    reservationController.checkIn
);

// Billing-aware checkout: Admin and Staff
router.post(
    '/:id/check-out',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    checkoutController.checkoutReservation
);

// Cancel: Admin and Customer
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'customer'),
    reservationController.remove
);

module.exports = router;
