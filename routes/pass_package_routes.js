const router = require('express').Router();
const passPackage = require('../controllers/pass_package_controller');
const { authenticateToken, isAdmin } = require('../middleware/auth_middleware');

router.use(authenticateToken);

router.get('/', passPackage.getAll);
router.get('/:id', passPackage.getById);
router.post('/', isAdmin, passPackage.create);
router.put('/:id', isAdmin, passPackage.update);
router.delete('/:id', isAdmin, passPackage.remove);

module.exports = router;