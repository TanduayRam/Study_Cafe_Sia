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

<<<<<<< Updated upstream
// POST /orders   with { reservation_id, items: [{ item_id, quantity }] }
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        const reservationId = toId(body.reservation_id, 'Reservation ID');
        const order = await orderModel.create(reservationId, body.items, req.user.user_id);
=======
// Create a new order
const create = async (req, res) => {
    const { reservation_id, items } = req.body;

    if (!Number.isInteger(Number(reservation_id)) ||
        Number(reservation_id) <= 0) {
        return res.status(400).json({
            message: 'A valid reservation ID is required.'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: 'At least one menu item is required.'
        });
    }

    const itemQuantities = new Map();

    for (const item of items) {
        const menuItemId = Number(item.item_id);
        const quantity = Number(item.quantity);

        if (!Number.isInteger(menuItemId) || menuItemId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: 'Each item must have a valid menu item ID and positive quantity.'
            });
        }

        itemQuantities.set(
            menuItemId,
            (itemQuantities.get(menuItemId) || 0) + quantity
        );
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check and lock the reservation
        const [reservations] = await connection.query(
            `SELECT * FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [reservation_id]
        );

        if (reservations.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        if (reservations[0].status !== 'CheckedIn') {
            await connection.rollback();
            return res.status(400).json({
                message: 'Orders can only be placed for checked-in reservations.'
            });
        }

        // Create the order
        const orderId = await orderModel.create(
            connection,
            reservation_id
        );

        let totalCents = 0;

        // Process each menu item
        for (const [menuItemId, quantity] of itemQuantities) {

            // Lock the menu item while checking its stock
            const [menuItems] = await connection.query(
                `SELECT * FROM menu_items
                 WHERE item_id = ?
                 FOR UPDATE`,
                [menuItemId]
            );

            if (menuItems.length === 0) {
                throw new Error(`Menu item ${menuItemId} not found.`);
            }

            const menuItem = menuItems[0];

            if (menuItem.stock < quantity) {
                throw new Error(
                    `Not enough stock for ${menuItem.name}. Available: ${menuItem.stock}.`
                );
            }

            // Calculate subtotal using integer cents
            const unitPriceCents = Math.round(
                Number(menuItem.price) * 100
            );

            const subtotalCents = unitPriceCents * quantity;
            totalCents += subtotalCents;

            // Deduct menu stock
            await connection.query(
                `UPDATE menu_items
                 SET stock = stock - ?
                 WHERE item_id = ?`,
                [quantity, menuItemId]
            );

            // Save the order item
            await orderItemModel.create(connection, {
                order_id: orderId,
                item_id: menuItemId,
                quantity,
                unit_price: menuItem.price,
                subtotal: (subtotalCents / 100).toFixed(2)
            });
        }

        // Save the final order total
        const total = (totalCents / 100).toFixed(2);

        await orderModel.updateTotal(
            connection,
            orderId,
            total
        );

        await connection.commit();

        res.status(201).json({
            message: 'Order created successfully.',
            order_id: orderId,
            reservation_id: Number(reservation_id),
            total_amount: total,
            status: 'Pending'
        });
>>>>>>> Stashed changes

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
