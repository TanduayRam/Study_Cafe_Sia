const checkoutModel = require('../models/checkout_model');

async function checkoutReservation(req, res) {
    try {
        const reservationId = Number(req.params.reservationId ?? req.params.id);
        const { payment_method } = req.body;

        if (!Number.isInteger(reservationId) || reservationId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reservation ID.'
            });
        }

        if (
            !payment_method ||
            typeof payment_method !== 'string' ||
            !payment_method.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required.'
            });
        }

        const normalizedPaymentMethod = payment_method.trim();
        const allowedPaymentMethods = ['Cash', 'GCash', 'Card'];

        if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Allowed methods are Cash, GCash, and Card.'
            });
        }

        // Use server time to prevent clients from manipulating checkout time.
        const checkoutTime = new Date();

        const result = await checkoutModel.checkoutReservation(
            reservationId,
            normalizedPaymentMethod,
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
