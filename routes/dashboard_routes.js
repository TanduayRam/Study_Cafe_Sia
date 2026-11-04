const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard_controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth_middleware');

// Only authenticated admins and staff can view the dashboard.
router.get(
    '/summary',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    dashboardController.getDashboardSummary
);

 module.exports = router;