const express = require('express');
const router = express.Router();

const sessionLogs = require('../controllers/session_logs_controller');

router.get('/', sessionLogs.getAll);
router.get('/:id', sessionLogs.getById);
router.post('/', sessionLogs.create);
router.put('/:id', sessionLogs.update);
router.delete('/:id', sessionLogs.remove);

module.exports = router;
