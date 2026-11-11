100%
const router = require('express').Router();
const sessionLogs = require('../controllers/session_logs_controller');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', sessionLogs.getAll);
router.get('/:id', sessionLogs.getById);
router.post('/', sessionLogs.create);
router.put('/:id', sessionLogs.update);
router.delete('/:id', isAdmin, sessionLogs.remove);

module.exports = router;