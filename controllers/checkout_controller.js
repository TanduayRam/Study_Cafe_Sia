const checkoutModel = require('../models/checkout_model');

async function checkoutReservation(req, res) {
    try {
        const reservationId = Number(req.params.reservationId);
        const { payment_method, checkout_time } = req.body;

        if (!Number.isInteger(reservationId) || reservationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        if (!payment_method || !payment_method.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required.'
            });
        }

        const checkoutTime = checkout_time
            ? new Date(checkout_time)
            : new Date();

        if (isNaN(checkoutTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid checkout time.'
            });
        }

        const result = await checkoutModel.checkoutReservation(
            reservationId,
            payment_method,
            checkoutTime
        );

        return res.status(200).json({
            success: true,
            message: 'Checkout completed successfully.',
            data: result
        });

    } catch (error) {
        console.error('Checkout error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    checkoutReservation
};