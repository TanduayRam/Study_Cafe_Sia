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

<<<<<<< Updated upstream
// Front-desk actions: only Admin and Staff.
router.post('/:id/check-in', isAdminOrStaff, reservation.checkIn);
router.post('/:id/check-out', isAdminOrStaff, reservation.checkOut);
=======
// View all reservations: Admin and Staff
router.get(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff', 'member'),
    reservationController.getAll
);

// View a specific reservation: Admin, Staff, and Customer
router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'staff', 'member'),
    reservationController.getById
);

// Create a reservation
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin', 'staff', 'member'),
    reservationController.create
);

// Update a reservation: Admin and Customer
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'member'),
    reservationController.update
);

// Check in: Admin and Staff
router.post(
    '/:id/check-in',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    reservationController.checkIn
);

// Billing-aware checkout: Admin and Staff
router.post(
    '/:id/check-out',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    checkoutController.checkoutReservation
);

// Cancel: Admin and Customer
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin', 'member'),
    reservationController.remove
);
>>>>>>> Stashed changes

module.exports = router;
