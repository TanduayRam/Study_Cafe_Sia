const router = require('express').Router();
const reservation = require('../controllers/reservationController');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken);

// A Member can only see and change their own reservations (the controller checks this).
router.get('/', reservation.getAll);
router.get('/:id', reservation.getById);
router.post('/', reservation.create);
router.put('/:id', reservation.update);
router.delete('/:id', reservation.remove);

// Front-desk actions: only Admin and Staff.
router.post('/:id/check-in', isAdminOrStaff, reservation.checkIn);
router.post('/:id/check-out', isAdminOrStaff, reservation.checkOut);

module.exports = router;
