const express = require('express');
const router = express.Router();

const auditLogs = require('../controllers/audit_logs_controller');

router.get('/', auditLogs.getAll);
router.get('/:id', auditLogs.getById);
router.post('/', auditLogs.create);
router.delete('/:id', auditLogs.remove);

module.exports = router;
