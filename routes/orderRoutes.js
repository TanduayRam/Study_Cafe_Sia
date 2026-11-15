const router = require('express').Router();
const order = require('../controllers/orderController');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', order.getAll);
router.get('/:id', order.getById);
router.post('/', order.create);
router.patch('/:id/status', order.updateStatus);
router.delete('/:id', order.remove);

module.exports = router;
