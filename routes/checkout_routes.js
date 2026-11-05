const express = require('express');
const router = express.Router();

const checkoutController = require('../controllers/checkout_controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth_middleware');

// Process reservation checkout: Admin and Staff
router.post(
    '/:reservationId',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    checkoutController.checkoutReservation
);

module.exports = router;