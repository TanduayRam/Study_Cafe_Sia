const db = require('../config/databases');
const orderModel = require('../models/orderModel');
const orderItemModel = require('../models/orderItemModel');
const logAction = require('../utils/audit_logger');

const {
    createError,
    sendSuccess,
    toId
} = require('../utils/http');


// ===============================================================
// GET ALL ORDERS
// Admin and Staff only (enforced by routes).
// ===============================================================

exports.getAll = async function (req, res, next) {
    try {
        const orders = await orderModel.getAll();

        return sendSuccess(
            res,
            orders,
            'Orders retrieved.'
        );
    } catch (error) {
        next(error);
    }
};


// ===============================================================
// GET ORDER BY ID
// Admin and Staff only (enforced by routes).
// ===============================================================

exports.getById = async function (req, res, next) {
    try {
        const orderId = toId(
            req.params.id,
            'Order ID'
        );

        const order = await orderModel.getById(orderId);

        if (!order) {
            throw createError(
                404,
                'Order not found.'
            );
        }

        const items = await orderItemModel.getByOrderId(orderId);

        return sendSuccess(
            res,
            {
                ...order,
                items
            },
            'Order retrieved.'
        );
    } catch (error) {
        next(error);
    }
};


// ===============================================================
// CREATE ORDER
// Admin, Staff, and Members can create orders.
//
// New orders automatically receive:
// status = Pending
// payment_status = Unpaid
// ===============================================================

exports.create = async function (req, res, next) {
    let connection;
    let transactionStarted = false;

    try {
        const role = req.user.role;
        const userId = req.user.user_id;

        // Only recognized roles can create orders.
        if (!['Admin', 'Staff', 'Member'].includes(role)) {
            throw createError(
                403,
                'You do not have permission to create orders.'
            );
        }

        const reservationId = toId(
            req.body.reservation_id,
            'Reservation ID'
        );

        const items = req.body.items;

        if (!Array.isArray(items) || items.length === 0) {
            throw createError(
                400,
                'At least one menu item is required.'
            );
        }

        // Combine repeated menu item IDs.
        const itemQuantities = new Map();

        for (const item of items) {
            if (!item || typeof item !== 'object') {
                throw createError(
                    400,
                    'Invalid order item.'
                );
            }

            const menuItemId = toId(
                item.menu_item_id,
                'Menu item ID'
            );

            const quantity = Number(item.quantity);

            if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                throw createError(
                    400,
                    'Quantity must be a positive whole number.'
                );
            }

            const combinedQuantity =
                (itemQuantities.get(menuItemId) || 0) + quantity;

            if (!Number.isSafeInteger(combinedQuantity)) {
                throw createError(
                    400,
                    'Order quantity is too large.'
                );
            }

            itemQuantities.set(
                menuItemId,
                combinedQuantity
            );
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock and verify the reservation.
        const [reservations] = await connection.query(
            `SELECT
                reservation_id,
                user_id,
                status
             FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [reservationId]
        );

        if (reservations.length === 0) {
            throw createError(
                404,
                'Reservation not found.'
            );
        }

        const reservation = reservations[0];

        // Members can only order using their own reservations.
        if (
            role === 'Member' &&
            String(reservation.user_id) !== String(userId)
        ) {
            throw createError(
                403,
                'You can only place orders for your own reservation.'
            );
        }

        // Orders require an active checked-in reservation.
        if (reservation.status !== 'CheckedIn') {
            throw createError(
                400,
                'Orders can only be placed for checked-in reservations.'
            );
        }

        // Create the order inside the transaction.
        const orderId = await orderModel.create(
            connection,
            reservationId
        );

        let totalCents = 0;

        for (const [menuItemId, quantity] of itemQuantities) {

            // Lock the menu item and check its stock.
            const [menuItems] = await connection.query(
                `SELECT
                    item_id,
                    name,
                    price,
                    stock
                 FROM menu_items
                 WHERE item_id = ?
                 FOR UPDATE`,
                [menuItemId]
            );

            if (menuItems.length === 0) {
                throw createError(
                    404,
                    `Menu item ${menuItemId} not found.`
                );
            }

            const menuItem = menuItems[0];

            if (Number(menuItem.stock) < quantity) {
                throw createError(
                    400,
                    `Not enough stock for ${menuItem.name}. Available: ${menuItem.stock}.`
                );
            }

            // Use integer cents for accurate calculations.
            const unitPriceCents = Math.round(
                Number(menuItem.price) * 100
            );

            const subtotalCents =
                unitPriceCents * quantity;

            totalCents += subtotalCents;

            if (!Number.isSafeInteger(totalCents)) {
                throw createError(
                    400,
                    'Order total is too large.'
                );
            }

            // Deduct stock.
            await connection.query(
                `UPDATE menu_items
                 SET stock = stock - ?
                 WHERE item_id = ?`,
                [quantity, menuItemId]
            );

            // Save the order item.
            await connection.query(
                `INSERT INTO order_items
                    (order_id, item_id, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    menuItemId,
                    quantity,
                    menuItem.price,
                    (subtotalCents / 100).toFixed(2)
                ]
            );
        }

        const total = (totalCents / 100).toFixed(2);

        await orderModel.updateTotal(
            connection,
            orderId,
            total
        );

        // Record the action in the same transaction.
        await logAction(
            userId,
            'CREATE',
            'orders',
            orderId,
            `Created order for reservation ${reservationId}. Total: ${total}. Payment status: Unpaid.`,
            connection
        );

        await connection.commit();
        transactionStarted = false;

        return sendSuccess(
            res,
            {
                order_id: orderId,
                reservation_id: reservationId,
                total_amount: total,
                status: 'Pending',
                payment_status: 'Unpaid'
            },
            'Order created successfully.',
            201
        );

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// ===============================================================
// UPDATE ORDER STATUS
// Admin and Staff only (enforced by routes).
//
// Allowed transitions:
// Pending -> Served
// Pending -> Cancelled
//
// Cancelling an order restores its stock.
// ===============================================================

exports.updateStatus = async function (req, res, next) {
    let connection;
    let transactionStarted = false;

    try {
        const orderId = toId(
            req.params.id,
            'Order ID'
        );

        const status = req.body.status;

        if (!['Served', 'Cancelled'].includes(status)) {
            throw createError(
                400,
                'Status must be Served or Cancelled.'
            );
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock the order to prevent simultaneous status changes.
        const [orders] = await connection.query(
            `SELECT
                order_id,
                status,
                payment_status
             FROM orders
             WHERE order_id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            throw createError(
                404,
                'Order not found.'
            );
        }

        const order = orders[0];

        if (order.status !== 'Pending') {
            throw createError(
                400,
                `Cannot change order status from ${order.status}.`
            );
        }

        // Restore stock when an order is cancelled.
        if (status === 'Cancelled') {
            const [items] = await connection.query(
                `SELECT
                    item_id,
                    quantity
                 FROM order_items
                 WHERE order_id = ?`,
                [orderId]
            );

            for (const item of items) {
                await connection.query(
                    `UPDATE menu_items
                     SET stock = stock + ?
                     WHERE item_id = ?`,
                    [
                        item.quantity,
                        item.item_id
                    ]
                );
            }
        }

        // Update order status.
        await connection.query(
            `UPDATE orders
             SET status = ?
             WHERE order_id = ?`,
            [status, orderId]
        );

        await logAction(
            req.user.user_id,
            'UPDATE',
            'orders',
            orderId,
            `Order status changed from Pending to ${status}.`,
            connection
        );

        await connection.commit();
        transactionStarted = false;

        return sendSuccess(
            res,
            {
                order_id: orderId,
                status,
                payment_status: order.payment_status
            },
            'Order status updated successfully.'
        );

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// ===============================================================
// MARK FOOD ORDER AS PAID
// PATCH /orders/:id/payment
//
// Admin and Staff only (enforced by routes).
//
// Rules:
// 1. Only Served orders can be marked as Paid.
// 2. Cancelled orders cannot be paid.
// 3. Pending orders cannot be paid.
// 4. Already-paid orders cannot be paid again.
// ===============================================================

exports.markAsPaid = async function (req, res, next) {
    let connection;
    let transactionStarted = false;

    try {
        const orderId = toId(
            req.params.id,
            'Order ID'
        );

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock the order to prevent simultaneous payment confirmation.
        const [orders] = await connection.query(
            `SELECT
                order_id,
                reservation_id,
                total_amount,
                status,
                payment_status
             FROM orders
             WHERE order_id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            throw createError(
                404,
                'Order not found.'
            );
        }

        const order = orders[0];

        // Only served orders can be paid.
        if (order.status !== 'Served') {
            throw createError(
                400,
                'Only Served orders can be marked as Paid.'
            );
        }

        // Prevent duplicate payment confirmation.
        if (order.payment_status === 'Paid') {
            throw createError(
                400,
                'This order has already been marked as Paid.'
            );
        }

        // Update payment status.
        await connection.query(
            `UPDATE orders
             SET payment_status = 'Paid'
             WHERE order_id = ?
             AND status = 'Served'
             AND payment_status = 'Unpaid'`,
            [orderId]
        );

        // Record the payment confirmation.
        await logAction(
            req.user.user_id,
            'UPDATE',
            'orders',
            orderId,
            `Food order payment confirmed. Reservation: ${order.reservation_id}. Amount: ${order.total_amount}. Payment status changed from Unpaid to Paid.`,
            connection
        );

        await connection.commit();
        transactionStarted = false;

        return sendSuccess(
            res,
            {
                order_id: orderId,
                reservation_id: order.reservation_id,
                total_amount: order.total_amount,
                status: order.status,
                payment_status: 'Paid'
            },
            'Food order marked as Paid successfully.'
        );

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
