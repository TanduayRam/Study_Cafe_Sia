const db = require('../config/databases');


const SELECT_LOG =
    'SELECT sl.session_log_id, sl.reservation_id, sl.user_id, u.name AS member_name, ' +
    'sl.zone_id, z.name AS zone_name, sl.seat_id, s.label AS seat_label, ' +
    'sl.start_time, sl.expected_end_time, sl.end_time, sl.status ' +
    'FROM session_logs sl ' +
    'INNER JOIN users u ON sl.user_id = u.user_id ' +
    'INNER JOIN study_zones z ON sl.zone_id = z.zone_id ' +
    'LEFT JOIN seats s ON sl.seat_id = s.seat_id';

async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_LOG;
    const values = [];

    if (filters.status) {
        sql = sql + ' WHERE sl.status = ?';
        values.push(filters.status);
    }

    sql = sql + ' ORDER BY sl.session_log_id DESC';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_LOG + ' WHERE sl.session_log_id = ?', [id]);
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        `INSERT INTO session_logs
         (reservation_id, user_id, zone_id, seat_id, start_time, expected_end_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.reservation_id, data.user_id, data.zone_id, data.seat_id,
         data.start_time, data.expected_end_time, data.end_time, data.status]
    );
    return getById(result.insertId);
}

async function update(id, data) {
    const [result] = await db.query(
        'UPDATE session_logs SET end_time = ?, status = ? WHERE session_log_id = ?',
        [data.end_time, data.status, id]
    );
    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM session_logs WHERE session_log_id = ?', [id]);
    return result.affectedRows > 0;
}

// ---- The three helpers below are called from check-in, check-out and no-show.
// ---- They receive the open transaction connection.

// Check-in: add one Active row.
async function startSession(connection, data) {
    const [result] = await connection.query(
        `INSERT INTO session_logs
         (reservation_id, user_id, zone_id, seat_id, start_time, expected_end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
        [data.reservation_id, data.user_id, data.zone_id, data.seat_id, data.start_time, data.expected_end_time]
    );
    return result.insertId;
}

// Check-out: close the Active row of this reservation.
async function endSession(connection, reservationId, endTime) {
    const [result] = await connection.query(
        `UPDATE session_logs SET end_time = ?, status = 'Completed'
         WHERE reservation_id = ? AND status = 'Active'`,
        [endTime, reservationId]
    );
    return result.affectedRows;
}

// No-show: add a row that records the missed booking.
async function recordNoShow(connection, data, now) {
    const [result] = await connection.query(
        `INSERT INTO session_logs
         (reservation_id, user_id, zone_id, seat_id, start_time, expected_end_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'NoShow')`,
        [data.reservation_id, data.user_id, data.zone_id, data.seat_id, data.start_time, data.end_time, now]
    );
    return result.insertId;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
    startSession: startSession,
    endSession: endSession,
    recordNoShow: recordNoShow
};