const express = require('express');
const router = express.Router();

const seatController = require('../controllers/seatController');

router.get('/', seatController.getAll);
router.get('/:id', seatController.getById);
router.post('/', seatController.create);
router.put('/:id', seatController.update);
router.delete('/:id', seatController.remove);

module.exports = router;