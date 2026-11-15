const router = require('express').Router();
const auth = require('../controllers/auth_controller');
const { authenticateToken } = require('../middleware/auth_middleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', authenticateToken, auth.logout);
router.get('/me', authenticateToken, auth.me);

module.exports = router;