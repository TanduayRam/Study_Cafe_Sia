
const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

const SYSTEM_USER_ID = 7;

exports.getAll = async (filters = {}) => {
    let query = `
        SELECT a.*, u.name AS user_name
        FROM alerts a
        JOIN users u ON a.user_id = u.id
    `;

    const conditions = [];
    const values = [];

    if (filters.status && filters.status !== 'All') {
        conditions.push('a.status = ?');
        values.push(filters.status);
    }

    if (filters.type && filters.type !== 'All') {
        conditions.push('a.alert_type = ?');
        values.push(filters.type);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC';

    const [rows] = await db.query(query, values);
    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM alerts WHERE alert_id = ?',
        [id]
    );

    return rows[0];
};

exports.create = async (userId, message, alertType) => {
    const [result] = await db.query(
        `INSERT INTO alerts (user_id, message, alert_type)
         VALUES (?, ?, ?)`,
        [userId, message, alertType]
    );

    return result.insertId;
};

exports.markAsRead = async (id) => {
    await db.query(
        'UPDATE alerts SET is_read = TRUE WHERE alert_id = ?',
        [id]
    );
};

exports.remove = async (id) => {
    await db.query(
        'DELETE FROM alerts WHERE alert_id = ?',
        [id]
    );
};

async function updateStatus(id, newStatus, action) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [alerts] = await connection.query(
            'SELECT alert_id, status FROM alerts WHERE alert_id = ? FOR UPDATE',
            [id]
        );

        if (alerts.length === 0) {
            await connection.rollback();
            return false;
        }

        const oldStatus = alerts[0].status;

        if (oldStatus !== newStatus) {
            await connection.query(
                'UPDATE alerts SET status = ? WHERE alert_id = ?',
                [newStatus, id]
            );

            await logAction({
                userId: SYSTEM_USER_ID,
                action,
                tableName: 'alerts',
                recordId: id,
                description: `System changed alert ${id} status from ${oldStatus} to ${newStatus}.`
            }, connection);
        }

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

exports.acknowledge = async (id) => {
    return updateStatus(id, 'Acknowledged', 'ACKNOWLEDGE');
};

exports.resolve = async (id) => {
    return updateStatus(id, 'Resolved', 'RESOLVE');
};
