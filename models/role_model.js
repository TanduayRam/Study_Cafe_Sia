const db = require('../config/databases');

async function getAll() {
    const [rows] = await db.query('SELECT role_id, name FROM roles ORDER BY role_id');
    return rows;
}

async function getById(id) {
    const [rows] = await db.query('SELECT role_id, name FROM roles WHERE role_id = ?', [id]);
    return rows[0];
}

async function getByName(name) {
    const [rows] = await db.query('SELECT role_id, name FROM roles WHERE name = ?', [name]);
    return rows[0];
}

module.exports = { getAll: getAll, getById: getById, getByName: getByName };