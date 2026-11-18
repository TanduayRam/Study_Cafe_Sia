const db = require('../config/databases');

// Shared query for retrieving session log details.
const SELECT_LOG =
    'SELECT sl.session_log_id, sl.reservation_id, sl.user_id, ' +
    'u.name AS member_name, sl.zone_id, z.name AS zone_name, ' +
    'sl.seat_id, s.label AS seat_label, ' +
    'sl.start_time, sl.expected_end_time, sl.end_time, sl.status ' +
    'FROM session_logs sl ' +
    'INNER JOIN users u ON sl.user_id = u.user_id ' +
    'INNER JOIN study_zones z ON sl.zone_id = z.zone_id ' +
    'LEFT JOIN seats s ON sl.seat_id = s.seat_id';

// GET all session logs, optionally filtered by status.
async function getAll(filters) {
    filters = filters || {};

    let sql = SELECT_LOG;
    const values = [];

    if (filters.status) {
        sql += ' WHERE sl.status = ?';
        values.push(filters.status);
    }

    sql += ' ORDER BY sl.session_log_id DESC';

    const [rows] = await db.query(sql, values);

    return rows;
}

// GET one session log by ID.
async function getById(id, connection) {
    const executor = connection || db;

    const [rows] = await executor.query(
        SELECT_LOG + ' WHERE sl.session_log_id = ?',
        [id]
    );

    return rows[0] || null;
}

// CREATE a session log.
async function create(data) {
    const [result] = await db.query(
        `INSERT INTO session_logs
            (
                reservation_id,
                user_id,
                zone_id,
                seat_id,
                start_time,
                expected_end_time,
                end_time,
                status
            )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.reservation_id,
            data.user_id,
            data.zone_id,
            data.seat_id,
            data.start_time,
            data.expected_end_time,
            data.end_time,
            data.status
        ]
    );

    return getById(result.insertId);
}

// UPDATE a session log.
async function update(id, data) {
    let sql = 'UPDATE session_logs SET status = ?';
    const values = [data.status];

    // Preserve end_time when it was not included in the update request.
    if (data.end_time !== undefined) {
        sql += ', end_time = ?';
        values.push(data.end_time);
    }

    sql += ' WHERE session_log_id = ?';
    values.push(id);

    await db.query(sql, values);

    // Retrieve the record to distinguish a missing ID from an unchanged record.
    return getById(id);
}

// DELETE a session log.
async function remove(id) {
    const [result] = await db.query(
        'DELETE FROM session_logs WHERE session_log_id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

// CHECK-IN: create an Active session inside the transaction.
async function startSession(connection, data) {
    const [result] = await connection.query(
        `INSERT INTO session_logs
            (
                reservation_id,
                user_id,
                zone_id,
                seat_id,
                start_time,
                expected_end_time,
                status
            )
         VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
        [
            data.reservation_id,
            data.user_id,
            data.zone_id,
            data.seat_id,
            data.start_time,
            data.expected_end_time
        ]
    );

    return result.insertId;
}

// CHECK-OUT: close the Active session inside the transaction.
async function endSession(connection, reservationId, endTime) {
    const [result] = await connection.query(
        `UPDATE session_logs
         SET end_time = ?,
             status = 'Completed'
         WHERE reservation_id = ?
           AND status = 'Active'`,
        [endTime, reservationId]
    );

    return result.affectedRows;
}

// NO-SHOW: record a missed reservation inside the transaction.
async function recordNoShow(connection, data, now) {
    const [result] = await connection.query(
        `INSERT INTO session_logs
            (
                reservation_id,
                user_id,
                zone_id,
                seat_id,
                start_time,s
                expected_end_time,
                end_time,
                status
            )
         VALUES (?, ?, ?, ?, ?, ?, ?, 'NoShow')`,
        [
            data.reservation_id,
            data.user_id,
            data.zone_id,
            data.seat_id,
            data.start_time,
            data.end_time,
            now
        ]
    );

    return result.insertId;
}

// Export model functions.
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