const router = require('express').Router();

const seat = require('../controllers/seatController');

const {
    authenticateToken,
    isAdmin,
    isAdminOrStaff
} = require('../middleware/auth_middleware');

// All seat routes require authentication.
router.use(authenticateToken);

// View seats: Admin, Staff, Member.
router.get('/', seat.getAll);
router.get('/:id', seat.getById);

// Create seat: Admin only.
router.post('/', isAdmin, seat.create);

// Update seat: Admin and Staff.
router.put('/:id', isAdminOrStaff, seat.update);

// Delete seat: Admin only.
router.delete('/:id', isAdmin, seat.remove);

module.exports = router;