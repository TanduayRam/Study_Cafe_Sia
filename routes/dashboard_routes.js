const router = require('express').Router();
const dashboard = require('../controllers/dashboard_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.get('/summary', authenticateToken, isAdminOrStaff, dashboard.getSummary);

module.exports = router;
