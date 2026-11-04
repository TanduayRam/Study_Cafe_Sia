const db = require('../config/databases');

// Get reservations with their order summaries.
async function getAll() {
    const query = `
        SELECT
            r.reservation_id,
            u.name AS member_name,
            s.label AS seat_label,
            sz.name AS zone_name,
            r.start_time,
            r.end_time,
            r.status,
            COUNT(o.order_id) AS order_count,
            COALESCE(SUM(o.total_amount), 0.00) AS orders_total
        FROM reservations AS r
        INNER JOIN users AS u
            ON r.user_id = u.id
        INNER JOIN seats AS s
            ON r.seat_id = s.seat_id
        INNER JOIN study_zones AS sz
            ON s.study_zone_id = sz.study_zone_id
        LEFT JOIN orders AS o
            ON r.reservation_id = o.reservation_id
        GROUP BY
            r.reservation_id,
            u.name,
            s.label,
            sz.name,
            r.start_time,
            r.end_time,
            r.status
        ORDER BY r.reservation_id DESC
    `;

    const [rows] = await db.query(query);
    return rows;
}

module.exports = {
    getAll
};
