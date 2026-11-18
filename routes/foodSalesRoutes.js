const express = require('express');
const router = express.Router();

const foodSalesController = require('../controllers/foodSalesController');

const {
    authenticateToken,
    isAdmin
} = require('../middleware/auth_middleware');

// ===============================================================
// FOOD SALES SUMMARY
// Admin only
// ===============================================================
router.get(
    '/summary',
    authenticateToken,
    isAdmin,
    foodSalesController.getSummary
);

// ===============================================================
// SALES BY CATEGORY
// Admin only
// ===============================================================
router.get(
    '/categories',
    authenticateToken,
    isAdmin,
    foodSalesController.getSalesByCategory
);

// ===============================================================
// BEST-SELLING ITEMS
// Admin only
// ===============================================================
router.get(
    '/best-sellers',
    authenticateToken,
    isAdmin,
    foodSalesController.getBestSellingItems
);

// ===============================================================
// DAILY SALES
// Admin only
// ===============================================================
router.get(
    '/daily',
    authenticateToken,
    isAdmin,
    foodSalesController.getDailySales
);

module.exports = router;