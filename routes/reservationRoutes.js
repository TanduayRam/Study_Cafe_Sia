const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');

router.get('/', reservationController.getAll);
router.get('/:id', reservationController.getById);
router.post('/', reservationController.create);
router.put('/:id', reservationController.update);

router.post('/:id/check-in', reservationController.checkIn);
router.post('/:id/check-out', reservationController.checkOut);

router.delete('/:id', reservationController.remove);
module.exports = router;
