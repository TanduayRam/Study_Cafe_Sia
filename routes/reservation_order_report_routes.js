const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reservation_order_report_controller');

// Get reservation-orders report.
router.get('/reservation-orders', reportController.getAll);

module.exports = router;
