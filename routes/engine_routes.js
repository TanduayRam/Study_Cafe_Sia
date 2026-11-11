const router = require('express').Router();
const engine = require('../controllers/engine_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.post('/check', authenticateToken, isAdminOrStaff, engine.check);

module.exports = router;