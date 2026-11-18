const db = require('../config/databases');

// Only fulfilled orders are included in food sales reports.
const SERVED_CONDITION = "o.status = 'Served'";

// Build optional date filters.
// The date range includes both the start and end dates.
function buildDateFilter(startDate, endDate) {
    let sql = '';
    const params = [];

    if (startDate) {
        sql += ' AND o.created_at >= ?';
        params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
        sql += ' AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
        params.push(endDate);
    }

    return { sql, params };
}

// Get overall food sales summary.
async function getSummary(startDate, endDate) {
    const filter = buildDateFilter(startDate, endDate);

    const [rows] = await db.query(
        `SELECT
            COUNT(DISTINCT o.order_id) AS total_orders,
            COALESCE(SUM(o.total_amount), 0) AS total_sales,
            COALESCE(SUM(oi.quantity), 0) AS total_items_sold
         FROM orders o
         LEFT JOIN order_items oi
            ON o.order_id = oi.order_id
         WHERE ${SERVED_CONDITION}
         ${filter.sql}`,
        filter.params
    );

    // Avoid multiplying order totals when an order has multiple items.
    // Summary is recalculated using separate queries below.
    const [orderRows] = await db.query(
        `SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(total_amount), 0) AS total_sales
         FROM orders o
         WHERE ${SERVED_CONDITION}
         ${filter.sql}`,
        filter.params
    );

    return {
        total_orders: Number(orderRows[0].total_orders),
        total_sales: Number(orderRows[0].total_sales),
        total_items_sold: Number(rows[0].total_items_sold)
    };
}

// Get sales grouped by menu category.
async function getSalesByCategory(startDate, endDate) {
    const filter = buildDateFilter(startDate, endDate);

    const [rows] = await db.query(
        `SELECT
            mi.category,
            SUM(oi.quantity) AS items_sold,
            SUM(oi.subtotal) AS total_sales
         FROM orders o
         INNER JOIN order_items oi
            ON o.order_id = oi.order_id
         INNER JOIN menu_items mi
            ON oi.item_id = mi.item_id
         WHERE ${SERVED_CONDITION}
         ${filter.sql}
         GROUP BY mi.category
         ORDER BY total_sales DESC`,
        filter.params
    );

    return rows;
}

// Get best-selling menu items.
async function getBestSellingItems(startDate, endDate) {
    const filter = buildDateFilter(startDate, endDate);

    const [rows] = await db.query(
        `SELECT
            mi.item_id,
            mi.name AS item_name,
            mi.category,
            SUM(oi.quantity) AS quantity_sold,
            SUM(oi.subtotal) AS total_sales
         FROM orders o
         INNER JOIN order_items oi
            ON o.order_id = oi.order_id
         INNER JOIN menu_items mi
            ON oi.item_id = mi.item_id
         WHERE ${SERVED_CONDITION}
         ${filter.sql}
         GROUP BY mi.item_id, mi.name, mi.category
         ORDER BY quantity_sold DESC, total_sales DESC`,
        filter.params
    );

    return rows;
}

// Get daily food sales.
async function getDailySales(startDate, endDate) {
    const filter = buildDateFilter(startDate, endDate);

    const [rows] = await db.query(
        `SELECT
            DATE(o.created_at) AS sale_date,
            COUNT(DISTINCT o.order_id) AS total_orders,
            SUM(oi.quantity) AS items_sold,
            SUM(oi.subtotal) AS total_sales
         FROM orders o
         INNER JOIN order_items oi
            ON o.order_id = oi.order_id
         WHERE ${SERVED_CONDITION}
         ${filter.sql}
         GROUP BY DATE(o.created_at)
         ORDER BY sale_date DESC`,
        filter.params
    );

    return rows;
}

module.exports = {
    getSummary,
    getSalesByCategory,
    getBestSellingItems,
    getDailySales
};