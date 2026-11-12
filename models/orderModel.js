const db = require('../config/databases');
const logAction = require('../utils/audit_logger');
const orderItems = require('./orderItemModel');
const { createError } = require('../utils/http');

const SELECT_ORDER =
    'SELECT o.order_id, o.reservation_id, u.name AS member_name, s.label AS seat_label, ' +
    'z.name AS zone_name, o.total_amount, o.status, o.created_at, ' +
    '(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS line_count ' +
    'FROM orders o ' +
    'INNER JOIN reservations r ON o.reservation_id = r.reservation_id ' +
    'INNER JOIN users u ON r.user_id = u.user_id ' +
    'INNER JOIN seats s ON r.seat_id = s.seat_id ' +
    'INNER JOIN study_zones z ON s.zone_id = z.zone_id';

// filters can have reservation_id and/or status.
async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_ORDER;
    const conditions = [];
    const values = [];

    if (filters.reservation_id) {
        conditions.push('o.reservation_id = ?');
        values.push(filters.reservation_id);
    }
    if (filters.status) {
        conditions.push('o.status = ?');
        values.push(filters.status);
    }
    if (conditions.length > 0) {
        sql = sql + ' WHERE ' + conditions.join(' AND ');
    }

    sql = sql + ' ORDER BY o.order_id DESC';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(SELECT_ORDER + ' WHERE o.order_id = ?', [id]);
    return rows[0];
}

// The order plus all its lines.
async function getWithItems(id) {
    const order = await getById(id);
    if (!order) {
        return null;
    }
    order.items = await orderItems.getByOrderId(id);
    return order;
}

// Sets orders.total_amount = the sum of its lines.
async function recalcTotal(connection, orderId) {
    await connection.query(
        `UPDATE orders
         SET total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?)
         WHERE order_id = ?`,
        [orderId, orderId]
    );
}

// RULE: orders can only be added while the reservation is CheckedIn.
async function checkReservationIsCheckedIn(connection, reservationId) {
    const [rows] = await connection.query(
        'SELECT reservation_id, status FROM reservations WHERE reservation_id = ? FOR UPDATE',
        [reservationId]
    );

    if (rows.length === 0) {
        throw createError(404, 'Reservation not found.');
    }
    if (rows[0].status !== 'CheckedIn') {
        throw createError(400, 'Orders can only be placed while the reservation is Checked In.');
    }
}

// New order with its lines. ONE transaction: order + lines + stock + audit line.
async function create(reservationId, items, actorId) {
    const lines = orderItems.normalizeItems(items);   // checks the list first
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await checkReservationIsCheckedIn(connection, reservationId);

        const [result] = await connection.query('INSERT INTO orders (reservation_id) VALUES (?)', [reservationId]);
        const orderId = result.insertId;

        await orderItems.insertItems(connection, orderId, lines);
        await recalcTotal(connection, orderId);
        await logAction(actorId, 'CREATE', 'orders', orderId,
            'Order created for reservation ' + reservationId + ' with ' + lines.length + ' line(s).', connection);

        await connection.commit();
        return getWithItems(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Adds more lines to a Pending order.
async function addItems(orderId, items, actorId) {
    const lines = orderItems.normalizeItems(items);
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            'SELECT order_id, reservation_id, status FROM orders WHERE order_id = ? FOR UPDATE',
            [orderId]
        );

        if (orders.length === 0) {
            throw createError(404, 'Order not found.');
        }
        if (orders[0].status !== 'Pending') {
            throw createError(400, 'Items can only be added to a Pending order (this one is ' + orders[0].status + ').');
        }

        await checkReservationIsCheckedIn(connection, orders[0].reservation_id);
        await orderItems.insertItems(connection, orderId, lines);
        await recalcTotal(connection, orderId);
        await logAction(actorId, 'ADD_ITEMS', 'orders', orderId,
            lines.length + ' line(s) added to order ' + orderId + '.', connection);

        await connection.commit();
        return getWithItems(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Removes one line from a Pending order and gives the stock back.
async function removeItem(orderItemId, actorId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT oi.order_item_id, oi.order_id, oi.item_id, oi.quantity, o.status
             FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE oi.order_item_id = ? FOR UPDATE`,
            [orderItemId]
        );

        if (rows.length === 0) {
            throw createError(404, 'Order item not found.');
        }

        const line = rows[0];

        if (line.status !== 'Pending') {
            throw createError(400, 'Only items of a Pending order can be removed (this order is ' + line.status + ').');
        }

        await connection.query('UPDATE menu_items SET stock = stock + ? WHERE item_id = ?', [line.quantity, line.item_id]);
        await connection.query('DELETE FROM order_items WHERE order_item_id = ?', [orderItemId]);
        await recalcTotal(connection, line.order_id);
        await logAction(actorId, 'REMOVE_ITEM', 'order_items', orderItemId,
            'Removed ' + line.quantity + ' x item ' + line.item_id + ' from order ' + line.order_id + '; stock restored.', connection);

        await connection.commit();
        return getWithItems(line.order_id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Pending -> Served, or Pending -> Cancelled (cancelling gives the stock back).
async function setStatus(orderId, newStatus, actorId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
            'SELECT order_id, status FROM orders WHERE order_id = ? FOR UPDATE',
            [orderId]
        );

        if (orders.length === 0) {
            throw createError(404, 'Order not found.');
        }
        if (orders[0].status !== 'Pending') {
            throw createError(400, 'Cannot change an order that is already ' + orders[0].status + '.');
        }

        if (newStatus === 'Cancelled') {
            const lines = await orderItems.getByOrderId(orderId, connection);

            for (let i = 0; i < lines.length; i++) {
                await connection.query('UPDATE menu_items SET stock = stock + ? WHERE item_id = ?',
                    [lines[i].quantity, lines[i].item_id]);
            }
        }

        await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', [newStatus, orderId]);
        await logAction(actorId, 'ORDER_' + newStatus.toUpperCase(), 'orders', orderId,
            'Order ' + orderId + ' marked ' + newStatus + '.', connection);

        await connection.commit();
        return getWithItems(orderId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getWithItems: getWithItems,
    create: create,
    addItems: addItems,
    removeItem: removeItem,
    setStatus: setStatus
};
