const router = require('express').Router();
const zone = require('../controllers/studyZoneController');
const { authenticateToken, isAdmin } = require('../middleware/auth_middleware');

router.use(authenticateToken);

router.get('/', zone.getAll);
router.get('/:id', zone.getById);
router.post('/', isAdmin, zone.create);
router.put('/:id', isAdmin, zone.update);
router.delete('/:id', isAdmin, zone.remove);

module.exports = router;
