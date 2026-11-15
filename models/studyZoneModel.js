const db = require('../config/databases');

async function getAll() {
    const [rows] = await db.query(
        'SELECT zone_id, name, type, hourly_rate, max_hours, capacity FROM study_zones ORDER BY zone_id'
    );
    return rows;
}

// "connection" is optional. Normally we use the shared db.
async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(
        'SELECT zone_id, name, type, hourly_rate, max_hours, capacity FROM study_zones WHERE zone_id = ?',
        [id]
    );
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO study_zones (name, type, hourly_rate, max_hours, capacity) VALUES (?, ?, ?, ?, ?)',
        [data.name, data.type, data.hourly_rate, data.max_hours, data.capacity]
    );
    return getById(result.insertId);
}

async function update(id, data) {
    const [result] = await db.query(
        'UPDATE study_zones SET name = ?, type = ?, hourly_rate = ?, max_hours = ?, capacity = ? WHERE zone_id = ?',
        [data.name, data.type, data.hourly_rate, data.max_hours, data.capacity, id]
    );
    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM study_zones WHERE zone_id = ?', [id]);
    return result.affectedRows > 0;
}

// How many seats belong to this zone?
async function countSeats(id) {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM seats WHERE zone_id = ?', [id]);
    return rows[0].total;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
    countSeats: countSeats
};
