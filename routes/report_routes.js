const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report_controller');

router.get('/menu-item-orders', reportController.getMenuItemOrders);

module.exports = router;