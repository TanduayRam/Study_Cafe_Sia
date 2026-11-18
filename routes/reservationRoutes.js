const router = require('express').Router();

const reservationController = require('../controllers/reservationController');
 
const {
    authenticateToken,
    isAdminOrStaff
} = require('../middleware/auth_middleware');

// All reservation routes require authentication.
router.use(authenticateToken);

// GET ALL RESERVATIONS
// Admin and Staff see all.
// Members see only their own reservations.
router.get(
    '/',
    reservationController.getAll 
);

// GET RESERVATION BY ID
// Members can only access their own reservations.
router.get(
    '/:id',
    reservationController.getById 
);

// CREATE RESERVATION
router.post(
    '/',
    reservationController.create 
); 

// UPDATE RESERVATION
router.put(
    '/:id',
    reservationController.update 
);

// CHECK IN RESERVATION
// Admin and Staff only.
router.post(
    '/:id/check-in',
    isAdminOrStaff,
    reservationController.checkIn
);

// CHECK OUT RESERVATION
// Admin and Staff only.
router.post(
    '/:id/check-out',
    isAdminOrStaff,
    reservationController.checkOut
);

// CANCEL RESERVATION
// Ownership and reservation status are checked by the controller.
router.delete(
    '/:id',
    reservationController.remove 
);
 
module.exports = router; 