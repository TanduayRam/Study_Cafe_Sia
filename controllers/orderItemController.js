const orderModel = require('../models/orderModel');
const orderItemModel = require('../models/orderItemModel');
const { createError, sendSuccess, toId } = require('../utils/http');

// GET /order-items   (optional ?order_id=1)
exports.getAll = async function (req, res, next) {
    try {
        const filters = {};

        if (req.query.order_id) {
            filters.order_id = toId(req.query.order_id, 'Order ID');
        }

        const lines = await orderItemModel.getAll(filters);
        return sendSuccess(res, lines, 'Order items retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /order-items/:id
exports.getById = async function (req, res, next) {
    try {
        const line = await orderItemModel.getById(toId(req.params.id, 'Order item ID'));

        if (!line) {
            throw createError(404, 'Order item not found.');
        }

        return sendSuccess(res, line, 'Order item retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /order-items   with { order_id, item_id, quantity }
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        const orderId = toId(body.order_id, 'Order ID');

        const order = await orderModel.addItems(
            orderId,
            [{ item_id: body.item_id, quantity: body.quantity }],
            req.user.user_id
        );

        return sendSuccess(res, order, 'Item added and stock updated.', 201);
    } catch (error) {
        next(error);
    }
};

// DELETE /order-items/:id
exports.remove = async function (req, res, next) {
    try {
        const order = await orderModel.removeItem(toId(req.params.id, 'Order item ID'), req.user.user_id);
        return sendSuccess(res, order, 'Item removed and stock returned.');
    } catch (error) {
        next(error);
    }
};
