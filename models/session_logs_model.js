const db = require('../config/databases');

const SYSTEM_USER_ID = 7;

exports.getAll = async () => {
    const [rows] = await db.query(
        `SELECT
            sl.*,
            u.name AS user_name,
            sz.name AS study_zone
         FROM session_logs sl
         JOIN users u ON sl.user_id = u.id
         JOIN study_zones sz
            ON sl.study_zone_id = sz.study_zone_id
         ORDER BY sl.session_log_id DESC`
    );

    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        `SELECT *
         FROM session_logs
         WHERE session_log_id = ?`,
        [id]
    );

    return rows[0];
};

exports.create = async (
    userId,
    studyZoneId,
    startTime,
    expectedEndTime,
    endTime,
    status
) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO session_logs
             (
                user_id,
                study_zone_id,
                start_time,
                expected_end_time,
                end_time,
                status
             )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                studyZoneId,
                startTime,
                expectedEndTime,
                endTime,
                status
            ]
        );

        await connection.query(
            `INSERT INTO audit_logs
             (user_id, action, table_name, record_id, description)
             VALUES (?, 'CHECKIN', 'session_logs', ?, ?)`,
            [
                SYSTEM_USER_ID,
                result.insertId,
                `Session ${result.insertId} was checked in. User ID: ${userId}.`
            ]
        );

        await connection.commit();
        return result.insertId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

exports.update = async (id, endTime, status) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `UPDATE session_logs
             SET end_time = ?, status = ?
             WHERE session_log_id = ?`,
            [endTime, status, id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        await connection.query(
            `INSERT INTO audit_logs
             (user_id, action, table_name, record_id, description)
             VALUES (?, 'CHECKOUT', 'session_logs', ?, ?)`,
            [
                SYSTEM_USER_ID,
                id,
                `Session ${id} was checked out. Status: ${status}.`
            ]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

exports.remove = async (id) => {
    await db.query(
        `DELETE FROM session_logs
         WHERE session_log_id = ?`,
        [id]
    );
};