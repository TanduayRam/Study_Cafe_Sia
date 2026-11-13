const db = require('../config/databases');

// Retrieve all pass packages.
async function getAll() {
    const [rows] = await db.query(
        'SELECT * FROM pass_packages ORDER BY package_id'
    );

    return rows;
}

// Retrieve one pass package by ID.
async function getById(id) {
    const [rows] = await db.query(
        'SELECT * FROM pass_packages WHERE package_id = ?',
        [id]
    );

    return rows[0] || null;
}

// Create a new pass package.
async function create(data) {
    const [result] = await db.query(
        `INSERT INTO pass_packages
        (name, hours, price, description, validity_days)
        VALUES (?, ?, ?, ?, ?)`,
        [
            data.name,
            data.hours,
            data.price,
            data.description,
            data.validity_days
        ]
    );

    return getById(result.insertId);
}

// Update an existing pass package.
async function update(id, data) {
    const [result] = await db.query(
        `UPDATE pass_packages
        SET name = ?, hours = ?, price = ?, description = ?, validity_days = ?
        WHERE package_id = ?`,
        [
            data.name,
            data.hours,
            data.price,
            data.description,
            data.validity_days,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getById(id);
}

// Delete a pass package.
async function remove(id) {
    const [result] = await db.query(
        'DELETE FROM pass_packages WHERE package_id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};