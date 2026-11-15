const router = require('express').Router();
const orderItem = require('../controllers/orderItemController');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', orderItem.getAll);
router.get('/:id', orderItem.getById);
router.post('/', orderItem.create);
router.delete('/:id', orderItem.remove);

module.exports = router;
