const express = require('express');
const router = express.Router();

const studyZoneController = require('../controllers/studyZoneController');

router.get('/', studyZoneController.getAll);
router.get('/:id', studyZoneController.getById);
router.post('/', studyZoneController.create);
router.put('/:id', studyZoneController.update);
router.delete('/:id', studyZoneController.remove);

module.exports = router;