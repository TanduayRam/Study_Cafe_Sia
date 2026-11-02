const billingModel = require('../models/billing_model');

async function computeBill(req, res) {
try {
const reservationId = Number(req.params.reservationId);


    if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid reservation ID.'
        });
    }

    // Convert checkout time into a JavaScript Date object
    const checkoutTime = req.query.checkout_time
        ? new Date(String(req.query.checkout_time).trim())
        : new Date();

    console.log('Received checkout time:', req.query.checkout_time);
    console.log('Parsed checkout time:', checkoutTime);

    if (isNaN(checkoutTime.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Invalid checkout time.'
        });
    }

    const bill = await billingModel.computeBill(
        reservationId,
        checkoutTime
    );

    return res.status(200).json({
        success: true,
        message: 'Bill calculated successfully.',
        data: bill
    });

} catch (error) {
    console.error('Billing error:', error);

    if (error.message === 'Reservation not found.') {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message === 'Invalid reservation ID.' ||
        error.message === 'Invalid checkout time.' ||
        error.message === 'Invalid reservation time.' ||
        error.message === 'Invalid study zone hourly rate.'
    ) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Failed to calculate the bill.'
    });
}


}

module.exports = { computeBill };
