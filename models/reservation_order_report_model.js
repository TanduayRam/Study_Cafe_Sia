const db = require('../config/databases');

// ---- REPORT 3 (Malingin): reservations with seat, zone, member and order totals ----
// INNER JOINs for data every reservation must have.
// The LEFT JOIN to orders is needed so reservations with NO orders are not dropped.
// Cancelled orders are not counted.
async function getAll() {
<<<<<<< Updated upstream
    const [rows] = await db.query(
        `SELECT r.reservation_id, u.name AS member_name, s.label AS seat_label,
                z.name AS zone_name, r.start_time, r.end_time, r.status,
                COUNT(o.order_id) AS order_count,
                COALESCE(SUM(o.total_amount), 0) AS orders_total
         FROM reservations r
         INNER JOIN users u ON r.user_id = u.user_id
         INNER JOIN seats s ON r.seat_id = s.seat_id
         INNER JOIN study_zones z ON s.zone_id = z.zone_id
         LEFT JOIN orders o ON o.reservation_id = r.reservation_id AND o.status <> 'Cancelled'
         GROUP BY r.reservation_id, u.name, s.label, z.name, r.start_time, r.end_time, r.status
         ORDER BY r.reservation_id DESC`
    );
=======
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
            ON r.user_id = u.user_id
        INNER JOIN seats AS s
            ON r.seat_id = s.seat_id
        INNER JOIN study_zones AS sz
            ON s.zone_id = sz.zone_id
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
>>>>>>> Stashed changes
    return rows;
}

module.exports = { getAll: getAll };
