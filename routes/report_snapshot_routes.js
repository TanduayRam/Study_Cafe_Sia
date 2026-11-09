const router = require('express').Router();
const snapshot = require('../controllers/report_snapshot_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/', snapshot.getAll);
router.get('/:id', snapshot.getById);
router.post('/', snapshot.create);
router.delete('/:id', snapshot.remove);

module.exports = router;
