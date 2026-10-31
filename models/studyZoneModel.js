
const db = require('../config/databases');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM study_zones'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM study_zones WHERE study_zone_id = ?',
        [id]
    );
    return rows[0];
};

const create = async (zone) => {
    const { name, type, hourly_rate, max_hours, capacity } = zone;

    const [result] = await db.query(
        `INSERT INTO study_zones
        (name, type, hourly_rate, max_hours, capacity)
        VALUES (?, ?, ?, ?, ?)`,
        [name, type, hourly_rate, max_hours, capacity]
    );

    return {
        study_zone_id: result.insertId,
        ...zone
    };
};

const update = async (id, zone) => {
    const { name, type, hourly_rate, max_hours, capacity } = zone;

    const [result] = await db.query(
        `UPDATE study_zones
        SET name = ?, type = ?, hourly_rate = ?,
            max_hours = ?, capacity = ?
        WHERE study_zone_id = ?`,
        [name, type, hourly_rate, max_hours, capacity, id]
    );

    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM study_zones WHERE study_zone_id = ?',
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
