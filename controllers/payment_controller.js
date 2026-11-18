const Payment = require('../models/payment_model');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

// GET /payments
// Retrieve all payments (Admin, Staff).
exports.getAll = async function (req, res, next) {
    try {
        const payments = await Payment.getAll();

        return sendSuccess(res, payments, 'Payments retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /payments/:id
// Retrieve one payment (Admin, Staff).
exports.getById = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Payment ID');
        const payment = await Payment.getById(id);

        if (!payment) {
            throw createError(404, 'Payment not found.');
        }

        return sendSuccess(res, payment, 'Payment retrieved.');
    } catch (error) {
        next(error);
    }
};

// PUT /payments/:id/void
// Void a payment (Admin only).
// Request body: { "reason": "..." }
exports.voidPayment = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Payment ID');
        const reason = (req.body || {}).reason;

        // Validate the void reason.
        if (isBlank(reason)) {
            throw createError(400, 'A reason is required to void a payment.');
        }

        const cleanReason = String(reason).trim();

        if (cleanReason.length > 500) {
            throw createError(400, 'The void reason cannot exceed 500 characters.');
        }

        // Check whether the payment exists.
        const payment = await Payment.getById(id);

        if (!payment) {
            throw createError(404, 'Payment not found.');
        }

        // Attempt to void the payment.
        const worked = await Payment.voidPayment(
            id,
            cleanReason,
            req.user.user_id
        );

        if (!worked) {
            throw createError(400, 'This payment is already voided.');
        }

        // Retrieve the updated payment.
        const updated = await Payment.getById(id);

        return sendSuccess(res, updated, 'Payment voided.');
    } catch (error) {
        next(error);
    }
};