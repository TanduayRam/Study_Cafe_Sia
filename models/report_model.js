
const db = require('../config/javier_database');

const getMenuItemOrders = async () => {
    const sql = `
        SELECT
            m.id,
            m.name,
            COUNT(oi.id) AS order_count
        FROM order_items oi
        RIGHT JOIN menu_items m
            ON m.id = oi.menu_item_id
        GROUP BY m.id, m.name
        ORDER BY m.name ASC
    `;

    const [rows] = await db.execute(sql);

    return rows;
};

module.exports = {
    getMenuItemOrders
};
