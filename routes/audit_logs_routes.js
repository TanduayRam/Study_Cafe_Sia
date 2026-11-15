const router = require('express').Router();
const auditLogs = require('../controllers/audit_logs_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', auditLogs.getAll);
router.get('/:id', auditLogs.getById);

module.exports = router;