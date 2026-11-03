const db = require('../config/databases');

// Get all orders
const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM orders'
    );
    return rows;
};

// Get one order by ID
const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?',
        [id]
    );
    return rows[0];
};

// Create a new order
const create = async (connection, reservationId) => {
    const [result] = await connection.query(
        `INSERT INTO orders (reservation_id)
         VALUES (?)`,
        [reservationId]
    );

    return result.insertId;
};

// Update order total
const updateTotal = async (connection, orderId, total) => {
    await connection.query(
        `UPDATE orders
         SET total_amount = ?
         WHERE order_id = ?`,
        [total, orderId]
    );
};

// Update order status
const updateStatus = async (id, status) => {
    const [result] = await db.query(
        `UPDATE orders
         SET status = ?
         WHERE order_id = ?`,
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
