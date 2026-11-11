const db = require('../config/databases');

// ---- REPORT 1 (Maldan): users with their role - INNER JOIN ----
// INNER JOIN fits because every user must have a role (role_id is NOT NULL).
// A LEFT JOIN would also list users that have no role (there are none).
async function getUsersRoles() {
    const [rows] = await db.query(
        `SELECT u.user_id, u.name, u.email, r.name AS role, u.is_active
         FROM users u
         INNER JOIN roles r ON u.role_id = r.role_id
         ORDER BY r.role_id, u.name`
    );
    return rows;
}

// ---- REPORT 2 (Pastrana): seats with no active reservation - LEFT JOIN ----
// LEFT JOIN keeps EVERY seat. The "active" test is in the ON part, so a seat whose
// only reservation is Completed or Cancelled still shows as idle.
// WHERE r.reservation_id IS NULL keeps only the seats that found no active reservation.
async function getIdleSeats() {
    const [rows] = await db.query(
        `SELECT s.seat_id, s.label AS seat_label, z.name AS zone_name, s.status AS seat_status
         FROM seats s
         INNER JOIN study_zones z ON s.zone_id = z.zone_id
         LEFT JOIN reservations r
                ON r.seat_id = s.seat_id AND r.status IN ('Confirmed', 'CheckedIn')
         WHERE r.reservation_id IS NULL
         ORDER BY z.zone_id, s.seat_id`
    );
    return rows;
}

// ---- REPORT 5 (Macias): members with passes vs members with reservations ----
// MySQL has no FULL OUTER JOIN, so we do: LEFT JOIN  UNION  RIGHT JOIN.
// UNION (not UNION ALL) removes the duplicate rows of members found on both sides.

// Summary of each member's passes.
const PASS_SIDE =
    'SELECT u.user_id, u.name AS member_name, ' +
    'COUNT(mp.member_pass_id) AS pass_count, SUM(mp.remaining_hours) AS remaining_hours ' +
    'FROM member_passes mp INNER JOIN users u ON mp.user_id = u.user_id ' +
    'GROUP BY u.user_id, u.name';

// Summary of each member's reservations.
const RESERVATION_SIDE =
    'SELECT u.user_id, u.name AS member_name, ' +
    'COUNT(r.reservation_id) AS reservation_count, MAX(r.start_time) AS last_reservation ' +
    'FROM reservations r INNER JOIN users u ON r.user_id = u.user_id ' +
    'GROUP BY u.user_id, u.name';

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

// The columns we show. p = pass side, r = reservation side.
// COALESCE picks the first value that is not NULL.
const ACTIVITY_COLUMNS =
    'COALESCE(p.user_id, r.user_id) AS user_id, ' +
    'COALESCE(p.member_name, r.member_name) AS member_name, ' +
    'COALESCE(p.pass_count, 0) AS pass_count, ' +
    'COALESCE(p.remaining_hours, 0) AS remaining_hours, ' +
    'COALESCE(r.reservation_count, 0) AS reservation_count, ' +
    'r.last_reservation AS last_reservation, ' +
    "CASE WHEN p.user_id IS NOT NULL AND r.user_id IS NOT NULL THEN 'Both' " +
    "WHEN p.user_id IS NOT NULL THEN 'Pass only' ELSE 'Reservation only' END AS activity";

async function getMemberActivity() {
    const sql =
        'SELECT * FROM (' +
            'SELECT ' + ACTIVITY_COLUMNS +
            ' FROM (' + PASS_SIDE + ') AS p LEFT JOIN (' + RESERVATION_SIDE + ') AS r ON p.user_id = r.user_id ' +
            'UNION ' +
            'SELECT ' + ACTIVITY_COLUMNS +
            ' FROM (' + PASS_SIDE + ') AS p RIGHT JOIN (' + RESERVATION_SIDE + ') AS r ON p.user_id = r.user_id' +
        ') AS member_activity ORDER BY member_name';

    const [rows] = await db.query(sql);
    return rows;
}

// ---- REPORT 6 (Javier): order count per menu item - RIGHT JOIN ----
// RIGHT JOIN keeps EVERY menu item, even one that was never ordered.
// COUNT(oi.order_item_id) counts only real order lines, so a never-ordered item shows 0.
// (COUNT(*) would wrongly show 1 for it.)
// The same result can be written as: FROM menu_items m LEFT JOIN order_items oi ON ...
async function getMenuItemOrders() {
    const [rows] = await db.query(
        `SELECT m.item_id, m.name, m.category,
                COUNT(oi.order_item_id) AS order_count,
                COALESCE(SUM(oi.quantity), 0) AS units_sold
         FROM order_items oi
         RIGHT JOIN menu_items m ON oi.item_id = m.item_id
         GROUP BY m.item_id, m.name, m.category
         ORDER BY order_count DESC, m.name`
    );
    return rows;
}

module.exports = {
    getUsersRoles: getUsersRoles,
    getIdleSeats: getIdleSeats,
    getMemberActivity: getMemberActivity,
    getMenuItemOrders: getMenuItemOrders
};
    getMenuItemOrders
 };
