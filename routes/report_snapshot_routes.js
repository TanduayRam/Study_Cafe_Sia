const express = require('express');
const router = express.Router();

const snapshotController = require('../controllers/report_snapshot_controller');

router.post('/', snapshotController.createSnapshot);

router.get('/', snapshotController.getAllSnapshots);

router.delete('/:id', snapshotController.deleteSnapshot);

module.exports = router;