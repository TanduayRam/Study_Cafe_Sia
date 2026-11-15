const router = require('express').Router();
const payment = require('../controllers/payment_controller');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', payment.getAll);
router.get('/:id', payment.getById);
router.put('/:id/void', isAdmin, payment.voidPayment);

module.exports = router;