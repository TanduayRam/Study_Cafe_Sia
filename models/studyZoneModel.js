const db = require('../config/databases');

// Retrieves all study zones.
async function getAll() {
    const [rows] = await db.query(
        `SELECT zone_id, name, type, hourly_rate, max_hours, capacity
         FROM study_zones
         ORDER BY zone_id`
    );

    return rows;
}

// Retrieves one study zone by ID.
// An optional connection supports database transactions.
async function getById(id, connection) {
    if (!connection) connection = db;

    const [rows] = await connection.query(
        `SELECT zone_id, name, type, hourly_rate, max_hours, capacity
         FROM study_zones
         WHERE zone_id = ?`,
        [id]
    );

    return rows[0] || null;
}

// Creates a study zone.
async function create(data) {
    const [result] = await db.query(
        `INSERT INTO study_zones
            (name, type, hourly_rate, max_hours, capacity)
         VALUES (?, ?, ?, ?, ?)`,
        [
            data.name,
            data.type,
            data.hourly_rate,
            data.max_hours,
            data.capacity
        ]
    );

    return getById(result.insertId);
}

// Updates an existing study zone.
async function update(id, data) {
    const [result] = await db.query(
        `UPDATE study_zones
         SET name = ?, type = ?, hourly_rate = ?, max_hours = ?, capacity = ?
         WHERE zone_id = ?`,
        [
            data.name,
            data.type,
            data.hourly_rate,
            data.max_hours,
            data.capacity,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getById(id);
}

// Deletes a study zone.
async function remove(id) {
    const [result] = await db.query(
        'DELETE FROM study_zones WHERE zone_id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

// Counts the seats assigned to a study zone.
async function countSeats(id) {
    const [rows] = await db.query(
        'SELECT COUNT(*) AS total FROM seats WHERE zone_id = ?',
        [id]
    );

    return Number(rows[0].total);
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    countSeats
};