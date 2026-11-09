const router = require('express').Router();
const user = require('../controllers/user_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.get('/', authenticateToken, isAdminOrStaff, user.getRoles);

module.exports = router;