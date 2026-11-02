const Payment = require('../models/payment_model');

// Get all payments
exports.getAll = async (req, res) => {
    try {
        const payments = await Payment.getAll();

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payments.'
        });
    }
};

// Get one payment
exports.getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID.'
            });
        }

        const payment = await Payment.getById(id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment.'
        });
    }
};

// Void a payment
exports.voidPayment = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { reason } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID.'
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A void reason is required.'
            });
        }

        const success = await Payment.voidPayment(id, reason.trim());

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found or already voided.'
            });
        }

        res.json({
            success: true,
            message: 'Payment voided successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to void payment.'
        });
    }
};