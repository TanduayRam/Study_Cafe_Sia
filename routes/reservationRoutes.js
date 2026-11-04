const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');
const checkoutController = require('../controllers/checkout_controller');

router.get('/', reservationController.getAll);
router.get('/:id', reservationController.getById);
router.post('/', reservationController.create);
router.put('/:id', reservationController.update);

router.post('/:id/check-in', reservationController.checkIn);

// Use billing-aware checkout instead of the reservation controller's basic check-out.
router.post('/:id/check-out', checkoutController.checkoutReservation);

router.delete('/:id', reservationController.remove);

module.exports = router;
