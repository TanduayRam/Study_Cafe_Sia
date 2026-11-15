const router = require('express').Router();
const menu = require('../controllers/menuItemController');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken);

router.get('/', menu.getAll);
router.get('/:id', menu.getById);
router.post('/', isAdminOrStaff, menu.create);
router.put('/:id', isAdminOrStaff, menu.update);
router.delete('/:id', isAdmin, menu.remove);

module.exports = router;
