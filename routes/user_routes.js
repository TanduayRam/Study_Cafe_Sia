const router = require('express').Router();
const user = require('../controllers/user_controller');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

// Everything here needs a valid login token.
router.use(authenticateToken);

// Staff need the member list for dropdowns (reservations, passes).
router.get('/members', isAdminOrStaff, user.getMembers);

// Everything else: only an Admin can manage users.
router.get('/', isAdmin, user.getUsers);
router.get('/:id', isAdmin, user.getUser);
router.post('/', isAdmin, user.createUser);
router.put('/:id', isAdmin, user.updateUser);
router.delete('/:id', isAdmin, user.deleteUser);

module.exports = router;