const router = require('express').Router();
const seat = require('../controllers/seatController');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken);

router.get('/', seat.getAll);
router.get('/:id', seat.getById);
router.post('/', isAdmin, seat.create);
router.put('/:id', isAdminOrStaff, seat.update);
router.patch('/:id', isAdminOrStaff, seat.update);
router.delete('/:id', isAdmin, seat.remove);

module.exports = router;
