const router = require('express').Router();
const billing = require('../controllers/billing_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/compute/:reservationId', billing.computeBill);
router.post('/release-no-shows', billing.releaseNoShows);

module.exports = router;