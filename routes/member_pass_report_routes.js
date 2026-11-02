const express = require('express');
const router = express.Router();

const memberPassReportController = require('../controllers/member_pass_report_controller');

// Get all member passes report
router.get('/member-passes', memberPassReportController.getAll);

module.exports = router;
