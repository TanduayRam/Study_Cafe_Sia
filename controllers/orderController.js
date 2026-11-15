const orderModel = require('../models/orderModel');
const { createError, sendSuccess, toId } = require('../utils/http');

const STATUSES = ['Pending', 'Served', 'Cancelled'];

// GET /orders   (optional ?reservation_id=1&status=Pending)
exports.getAll = async function (req, res, next) {
    try {
        const filters = {};

        if (req.query.reservation_id) {
            filters.reservation_id = toId(req.query.reservation_id, 'Reservation ID');
        }
        if (req.query.status) {
            if (STATUSES.includes(req.query.status) === false) {
                throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
            }
            filters.status = req.query.status;
        }

        const orders = await orderModel.getAll(filters);
        return sendSuccess(res, orders, 'Orders retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /orders/:id   (the order with its lines)
exports.getById = async function (req, res, next) {
    try {
        const order = await orderModel.getWithItems(toId(req.params.id, 'Order ID'));

        if (!order) {
            throw createError(404, 'Order not found.');
        }

        return sendSuccess(res, order, 'Order retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /orders   with { reservation_id, items: [{ item_id, quantity }] }
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        const reservationId = toId(body.reservation_id, 'Reservation ID');
        const order = await orderModel.create(reservationId, body.items, req.user.user_id);

        return sendSuccess(res, order, 'Order saved and stock updated.', 201);
    } catch (error) {
        next(error);
    }
};

// PATCH /orders/:id/status   with { "status": "Served" or "Cancelled" }
exports.updateStatus = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Order ID');
        const status = (req.body || {}).status;

        if (status !== 'Served' && status !== 'Cancelled') {
            throw createError(400, 'Status must be Served or Cancelled.');
        }

        const order = await orderModel.setStatus(id, status, req.user.user_id);
        return sendSuccess(res, order, 'Order ' + status.toLowerCase() + '.');
    } catch (error) {
        next(error);
    }
};

// DELETE /orders/:id   = cancel the order (the stock is returned)
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Order ID');
        const order = await orderModel.setStatus(id, 'Cancelled', req.user.user_id);
        return sendSuccess(res, order, 'Order cancelled and stock returned.');
    } catch (error) {
        next(error);
    }
};
