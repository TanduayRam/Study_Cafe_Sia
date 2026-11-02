
const db = require('../config/databases');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM seats'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM seats WHERE seat_id = ?',
        [id]
    );
    return rows[0];
};

const create = async (seat) => {
    const { study_zone_id, label, status } = seat;

    const [result] = await db.query(
        `INSERT INTO seats
        (study_zone_id, label, status)
        VALUES (?, ?, ?)`,
        [study_zone_id, label, status]
    );

    return {
        seat_id: result.insertId,
        ...seat
    };
};

const update = async (id, seat) => {
    const { study_zone_id, label, status } = seat;

    const [result] = await db.query(
        `UPDATE seats
        SET study_zone_id = ?, label = ?, status = ?
        WHERE seat_id = ?`,
        [study_zone_id, label, status, id]
    );

    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM seats WHERE seat_id = ?',
        [id]
    );

    return result.affectedRows;
};
// Get seats without active reservations (LEFT JOIN)
const getSeatsWithoutActiveReservation = async () => {
    const [rows] = await db.query(
        `SELECT
            s.seat_id,
            s.label AS seat_label,
            s.status AS seat_status,
            s.study_zone_id
        FROM seats s
        LEFT JOIN reservations r
            ON s.seat_id = r.seat_id
            AND r.status IN ('Confirmed', 'CheckedIn')
        WHERE r.reservation_id IS NULL
        ORDER BY s.study_zone_id, s.seat_id`
    );

    return rows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getSeatsWithoutActiveReservation
};