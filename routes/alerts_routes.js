const router = require('express').Router();
const alerts = require('../controllers/alerts_controller');
const { authenticateToken, isAdmin, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', alerts.getAll);
router.get('/:id', alerts.getById);
router.post('/', alerts.create);
router.put('/:id', alerts.update);
router.patch('/:id', alerts.patch);
router.patch('/:id/acknowledge', alerts.acknowledge);
router.patch('/:id/resolve', alerts.resolve);
router.delete('/:id', isAdmin, alerts.remove);

module.exports = router;