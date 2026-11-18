const db = require('../config/databases');

// ===============================================================
// GET ALL ORDERS
// Includes reservation, member, order status, and payment status.
// ===============================================================

const getAll = async () => {
    const [rows] = await db.query(
        `SELECT
            o.order_id,
            o.reservation_id,
            o.total_amount,
            o.status,
            o.payment_status,
            o.created_at,
            r.user_id,
            u.name AS member_name,
            u.email AS member_email
         FROM orders o
         INNER JOIN reservations r
            ON o.reservation_id = r.reservation_id
         INNER JOIN users u
            ON r.user_id = u.user_id
         ORDER BY o.created_at DESC`
    );

    return rows;
};


// ===============================================================
// GET ORDER BY ID
// Can use either the database connection or a transaction connection.
// ===============================================================

const getById = async (id, connection) => {
    if (!connection) {
        connection = db;
    }

    const [rows] = await connection.query(
        `SELECT
            o.order_id,
            o.reservation_id,
            o.total_amount,
            o.status,
            o.payment_status,
            o.created_at,
            r.user_id,
            u.name AS member_name,
            u.email AS member_email
         FROM orders o
         INNER JOIN reservations r
            ON o.reservation_id = r.reservation_id
         INNER JOIN users u
            ON r.user_id = u.user_id
         WHERE o.order_id = ?`,
        [id]
    );

    return rows[0] || null;
};


// ===============================================================
// CREATE ORDER
// payment_status automatically defaults to Unpaid.
// ===============================================================

const create = async (connection, reservationId) => {
    const [result] = await connection.query(
        `INSERT INTO orders (reservation_id)
         VALUES (?)`,
        [reservationId]
    );

    return result.insertId;
};


// ===============================================================
// UPDATE ORDER TOTAL
// ===============================================================

const updateTotal = async (connection, orderId, total) => {
    const [result] = await connection.query(
        `UPDATE orders
         SET total_amount = ?
         WHERE order_id = ?`,
        [total, orderId]
    );

    return result.affectedRows;
};


// ===============================================================
// UPDATE ORDER STATUS
// Only Pending orders can become Served or Cancelled.
// ===============================================================

const updateStatus = async (connection, id, status) => {
    const [result] = await connection.query(
        `UPDATE orders
         SET status = ?
         WHERE order_id = ?
         AND status = 'Pending'`,
        [status, id]
    );

    return result.affectedRows;
};


module.exports = {
    getAll,
    getById,
    create,
    updateTotal,
    updateStatus
};
