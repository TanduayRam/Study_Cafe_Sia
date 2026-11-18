const db = require('../config/databases');

// Get all reservations with member, seat, and study zone details.
const getAll = async () => {
    const [rows] = await db.query(
        `SELECT
            r.*,
            u.name AS member_name,
            s.label AS seat_label,
            sz.name AS zone_name
        FROM reservations r
        INNER JOIN users u
            ON r.user_id = u.user_id
        INNER JOIN seats s
            ON r.seat_id = s.seat_id
        INNER JOIN study_zones sz
            ON s.zone_id = sz.zone_id
        ORDER BY r.reservation_id DESC`
    );

    return rows;
};

// Get one reservation by ID with related details.
const getById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            r.*,
            u.name AS member_name,
            s.label AS seat_label,
            sz.name AS zone_name
        FROM reservations r
        INNER JOIN users u
            ON r.user_id = u.user_id
        INNER JOIN seats s
            ON r.seat_id = s.seat_id
        INNER JOIN study_zones sz
            ON s.zone_id = sz.zone_id
        WHERE r.reservation_id = ?`,
        [id]
    );

    return rows[0] || null;
};

// Create a new reservation.
const create = async (reservation) => {
    const {
        user_id,
        seat_id,
        start_time,
        end_time
    } = reservation;

    const [result] = await db.query(
        `INSERT INTO reservations
            (user_id, seat_id, start_time, end_time)
         VALUES (?, ?, ?, ?)`,
        [user_id, seat_id, start_time, end_time]
    );

    return getById(result.insertId);
};

// Update an existing reservation.
const update = async (id, reservation) => {
    const {
        seat_id,
        start_time,
        end_time,
        status
    } = reservation;

    const [result] = await db.query(
        `UPDATE reservations
         SET seat_id = ?,
             start_time = ?,
             end_time = ?,
             status = ?
         WHERE reservation_id = ?`,
        [seat_id, start_time, end_time, status, id]
    );

    return result.affectedRows;
};

// Cancel a reservation without deleting its history.
const remove = async (id) => {
    const [result] = await db.query(
        `UPDATE reservations
         SET status = 'Cancelled'
         WHERE reservation_id = ?`,
        [id]
    );

    return result.affectedRows;
};
 
module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
 };