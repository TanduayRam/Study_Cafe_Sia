const checkoutModel = require('../models/checkout_model');
const { sendSuccess, createError, isBlank, toId } = require('../utils/http');

exports.checkoutReservation = async function (req, res, next) {
    try {
        const reservationId = toId(req.params.id, 'Reservation ID');
        const paymentMethod = req.body && req.body.payment_method;
        if (isBlank(paymentMethod)) throw createError(400, 'Payment method is required.');
        const result = await checkoutModel.checkoutReservation(reservationId, String(paymentMethod).trim());
        return sendSuccess(res, result, 'Reservation checked out and payment recorded.');
    } catch (error) {
        if (/not found/i.test(error.message)) error.status = 404;
        else if (/Only checked-in|Insufficient/i.test(error.message)) error.status = 400;
        next(error);
    }
};
