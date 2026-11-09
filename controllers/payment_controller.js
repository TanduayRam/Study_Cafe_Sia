const Payment = require('../models/payment_model');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

// GET /payments
exports.getAll = async function (req, res, next) {
    try {
        const payments = await Payment.getAll();
        return sendSuccess(res, payments, 'Payments retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /payments/:id
exports.getById = async function (req, res, next) {
    try {
        const payment = await Payment.getById(toId(req.params.id, 'Payment ID'));

        if (!payment) {
            throw createError(404, 'Payment not found.');
        }

        return sendSuccess(res, payment, 'Payment retrieved.');
    } catch (error) {
        next(error);
    }
};

// PUT /payments/:id/void   with { "reason": "..." }
exports.voidPayment = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Payment ID');
        const reason = (req.body || {}).reason;

        if (isBlank(reason)) {
            throw createError(400, 'A reason is required to void a payment.');
        }

        const payment = await Payment.getById(id);
        if (!payment) {
            throw createError(404, 'Payment not found.');
        }

        const worked = await Payment.voidPayment(id, String(reason).trim(), req.user.user_id);
        if (!worked) {
            throw createError(400, 'This payment is already voided.');
        }

        const updated = await Payment.getById(id);
        return sendSuccess(res, updated, 'Payment voided.');
    } catch (error) {
        next(error);
    }
};