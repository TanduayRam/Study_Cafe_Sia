const router = require('express').Router();

const zone = require('../controllers/studyZoneController');

const {
    authenticateToken,
    isAdmin
} = require('../middleware/auth_middleware');

// All study zone routes require authentication.
router.use(authenticateToken);

// View study zones: Admin, Staff, Member.
router.get('/', zone.getAll);
router.get('/:id', zone.getById);

// Manage study zones: Admin only.
router.post('/', isAdmin, zone.create);
router.put('/:id', isAdmin, zone.update);
router.delete('/:id', isAdmin, zone.remove);

module.exports = router;