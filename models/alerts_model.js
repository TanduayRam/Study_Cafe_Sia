const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

// created_by_name shows "System" when an alert was made automatically (created_by is empty).
const SELECT_ALERT =
    "SELECT a.alert_id, a.alert_type, a.zone_id, z.name AS zone_name, " +
    "a.seat_id, s.label AS seat_label, a.item_id, m.name AS item_name, " +
    "a.message, a.status, a.created_by, COALESCE(u.name, 'System') AS created_by_name, " +
    "a.created_at, a.updated_at " +
    "FROM alerts a " +
    "LEFT JOIN study_zones z ON a.zone_id = z.zone_id " +
    "LEFT JOIN seats s ON a.seat_id = s.seat_id " +
    "LEFT JOIN menu_items m ON a.item_id = m.item_id " +
    "LEFT JOIN users u ON a.created_by = u.user_id";

// filters can have status and/or type.
async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_ALERT;
    const conditions = [];
    const values = [];

    if (filters.status) {
        conditions.push('a.status = ?');
        values.push(filters.status);
    }
    if (filters.type) {
        conditions.push('a.alert_type = ?');
        values.push(filters.type);
    }
    if (conditions.length > 0) {
        sql = sql + ' WHERE ' + conditions.join(' AND ');
    }

    sql = sql + ' ORDER BY a.alert_id DESC';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_ALERT + ' WHERE a.alert_id = ?', [id]);
    return rows[0];
}

// Creates an Open alert ONLY if there is no Open alert yet for the same type + zone/seat/item.
// Returns the new alert id, or null when it would be a duplicate.
// "<=>" is MySQL's "equals" that also works when both sides are NULL.
async function createIfNew(connection, data, userId) {
    const zoneId = data.zone_id || null;
    const seatId = data.seat_id || null;
    const itemId = data.item_id || null;
    if (userId === undefined) userId = null;

    const [existing] = await connection.query(
        `SELECT alert_id FROM alerts
         WHERE alert_type = ? AND status = 'Open'
           AND zone_id <=> ? AND seat_id <=> ? AND item_id <=> ?
         LIMIT 1`,
        [data.alert_type, zoneId, seatId, itemId]
    );

    if (existing.length > 0) {
        return null;   // duplicate, do not create
    }

    const [result] = await connection.query(
        `INSERT INTO alerts (alert_type, zone_id, seat_id, item_id, message, status, created_by)
         VALUES (?, ?, ?, ?, ?, 'Open', ?)`,
        [data.alert_type, zoneId, seatId, itemId, data.message, userId]
    );

    // The audit line is saved in the same transaction as the alert.
    await logAction(userId, 'CREATE_ALERT', 'alerts', result.insertId,
        data.alert_type + ' alert: ' + data.message, connection);

    return result.insertId;
}

// Edit the type and message (PUT).
async function update(id, data, userId) {
    const [result] = await db.query(
        'UPDATE alerts SET message = ?, alert_type = ? WHERE alert_id = ?',
        [data.message, data.alert_type, id]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    await logAction(userId, 'UPDATE_ALERT', 'alerts', id, 'Alert details edited.');
    return getById(id);
}

// Acknowledge or Resolve. The audit line is saved in the same transaction.
// Returns an object: { alert: ... } when it worked, or { error: 'missing' | 'same' | 'closed' }.
async function setStatus(id, newStatus, userId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT alert_id, status FROM alerts WHERE alert_id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return { error: 'missing' };
        }

        const oldStatus = rows[0].status;

        if (oldStatus === newStatus) {
            await connection.rollback();
            return { error: 'same', oldStatus: oldStatus };
        }
        if (oldStatus === 'Resolved') {
            await connection.rollback();
            return { error: 'closed', oldStatus: oldStatus };
        }

        await connection.query('UPDATE alerts SET status = ? WHERE alert_id = ?', [newStatus, id]);

        let action = 'RESOLVE_ALERT';
        if (newStatus === 'Acknowledged') action = 'ACKNOWLEDGE_ALERT';

        await logAction(userId, action, 'alerts', id,
            'Alert status changed from ' + oldStatus + ' to ' + newStatus + '.', connection);

        await connection.commit();
        const alert = await getById(id);
        return { alert: alert };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM alerts WHERE alert_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    createIfNew: createIfNew,
    update: update,
    setStatus: setStatus,
    remove: remove
};