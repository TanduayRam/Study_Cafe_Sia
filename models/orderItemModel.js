const db = require('../config/databases');

// Get all items belonging to an order
const getByOrderId = async (orderId) => {
    const [rows] = await db.query(
        `SELECT
            oi.order_item_id,
            oi.order_id,
            oi.menu_item_id,
            mi.name AS menu_item_name,
            oi.quantity,
            oi.unit_price,
            oi.subtotal
         FROM order_items oi
         INNER JOIN menu_items mi
            ON oi.menu_item_id = mi.menu_item_id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    return rows;
};

// Add an item to an order
const create = async (connection, item) => {
    const {
        order_id,
        menu_item_id,
        quantity,
        unit_price,
        subtotal
    } = item;

    const [result] = await connection.query(
        `INSERT INTO order_items
        (order_id, menu_item_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)`,
        [order_id, menu_item_id, quantity, unit_price, subtotal]
    );

    return result.insertId;
};

module.exports = {
    getByOrderId,
    create
};
