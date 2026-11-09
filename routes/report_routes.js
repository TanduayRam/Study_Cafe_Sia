const router = require('express').Router();
const report = require('../controllers/report_controller');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth_middleware');

router.use(authenticateToken, isAdminOrStaff);

router.get('/users-roles', report.usersRoles);                // Maldan      - INNER
router.get('/idle-seats', report.idleSeats);                  // Pastrana    - LEFT
router.get('/reservation-orders', report.reservationOrders);  // Malingin    - INNER
router.get('/member-passes', report.memberPasses);            // Pontunilla  - INNER
router.get('/member-activity', report.memberActivity);        // Macias      - FULL OUTER (LEFT UNION RIGHT)
router.get('/menu-item-orders', report.menuItemOrders);       // Javier      - RIGHT

module.exports = router;
