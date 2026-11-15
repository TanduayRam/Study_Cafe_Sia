const db = require('../config/databases');

// The same SELECT is used by the list and by "get one", so we keep it in one place.
const SELECT_SEAT =
    'SELECT s.seat_id, s.zone_id, z.name AS zone_name, z.type AS zone_type, ' +
    'z.hourly_rate, z.max_hours, s.label, s.status ' +
    'FROM seats s INNER JOIN study_zones z ON s.zone_id = z.zone_id';

// filters can have zone_id and/or status.
async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_SEAT;
    const conditions = [];
    const values = [];

    if (filters.zone_id) {
        conditions.push('s.zone_id = ?');
        values.push(filters.zone_id);
    }
    if (filters.status) {
        conditions.push('s.status = ?');
        values.push(filters.status);
    }
    if (conditions.length > 0) {
        sql = sql + ' WHERE ' + conditions.join(' AND ');
    }

    sql = sql + ' ORDER BY s.zone_id, s.seat_id';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_SEAT + ' WHERE s.seat_id = ?', [id]);
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO seats (zone_id, label, status) VALUES (?, ?, ?)',
        [data.zone_id, data.label, data.status]
    );
    return getById(result.insertId);
}

async function update(id, data) {
    const [result] = await db.query(
        'UPDATE seats SET zone_id = ?, label = ?, status = ? WHERE seat_id = ?',
        [data.zone_id, data.label, data.status, id]
    );
    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM seats WHERE seat_id = ?', [id]);
    return result.affectedRows > 0;
}

async function countReservations(id) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM reservations WHERE seat_id = ?', [id]);
    return rows[0].total;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
    countReservations: countReservations
};
