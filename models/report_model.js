const db = require('../config/databases');

const getMenuItemOrders = async () => {
    const sql = `
        SELECT
            m.menu_item_id,
            m.name,
            COUNT(oi.order_item_id) AS order_count
        FROM menu_items m
        LEFT JOIN order_items oi
            ON m.menu_item_id = oi.menu_item_id
        GROUP BY m.menu_item_id, m.name
        ORDER BY m.name ASC
    `;

    const [rows] = await db.execute(sql);

    return rows;
};

module.exports = {
    getMenuItemOrders
 };