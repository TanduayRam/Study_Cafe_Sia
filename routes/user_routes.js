const router = require('express').Router();

const user = require('../controllers/user_controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/auth_middleware');

// Only administrators can view all users.
router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    user.getUsers
);

// Only administrators can delete users.
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    user.deleteUser
);

module.exports = router;