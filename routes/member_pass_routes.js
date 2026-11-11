const router = require('express').Router();
const memberPass = require('../controllers/member_pass_controller');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken);

router.get('/', isAdminOrStaff, memberPass.getAll);
router.get('/user/:userId', memberPass.getByUserId);   // a Member can only see their own passes
router.get('/:id', memberPass.getById);                // a Member can only see their own passes
router.post('/', isAdminOrStaff, memberPass.assign);
router.delete('/:id', isAdmin, memberPass.remove);

module.exports = router;