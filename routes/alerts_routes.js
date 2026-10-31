
const express = require('express');
const router = express.Router();

const alerts = require('../controllers/alerts_controller');

router.get('/', alerts.getAll);
router.get('/:id', alerts.getById);

router.post('/', alerts.create);

router.patch('/:id/read', alerts.markAsRead);
router.patch('/:id/acknowledge', alerts.acknowledge);
router.patch('/:id/resolve', alerts.resolve);

router.delete('/:id', alerts.remove);

module.exports = router;
