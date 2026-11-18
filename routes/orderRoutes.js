const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

const {
    authenticateToken,
    isAdminOrStaff
} = require('../middleware/auth_middleware');

// ===============================================================
// VIEW ALL ORDERS
// Admin and Staff only
// ===============================================================
router.get(
    '/',
    authenticateToken,
    isAdminOrStaff,
    orderController.getAll
);

// ===============================================================
// VIEW ONE ORDER
// Admin and Staff only
// ===============================================================
router.get(
    '/:id',
    authenticateToken,
    isAdminOrStaff,
    orderController.getById
);

// ===============================================================
// CREATE ORDER
// Admin, Staff, and Member
// Member ownership and CheckedIn reservation validation
// are handled inside orderController.create.
// ===============================================================
router.post(
    '/',
    authenticateToken,
    orderController.create 
);

// ===============================================================
// UPDATE ORDER STATUS
// Admin and Staff only
// ===============================================================
router.patch(
    '/:id/status',
    authenticateToken,
    isAdminOrStaff,
    orderController.updateStatus
);

// ===============================================================
// CONFIRM FOOD ORDER PAYMENT
// Admin and Staff only
// Only Served and Unpaid orders can be marked as Paid.
// ===============================================================
router.patch(
    '/:id/payment',
    authenticateToken,
    isAdminOrStaff,
    orderController.markAsPaid
);

// ===============================================================
// TEMPORARY DIAGNOSTIC TEST
// Tests whether a logged-in Member can access the order route.
// Remove this endpoint after testing.
// ===============================================================
router.post(
    '/test-member-access',
    authenticateToken,
    function (req, res) {
        return res.json({
            success: true,
            message: 'Member route works.',
            role: req.user.role,
            user_id: req.user.user_id
        });
    }
);

module.exports = router;