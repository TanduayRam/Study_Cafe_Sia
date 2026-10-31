const db = require('../config/databases');

// Get all pass packages
async function getAll() {
    const [rows] = await db.query(
        'SELECT * FROM pass_packages ORDER BY pass_package_id DESC'
    );
    return rows;
}

// Get one pass package by ID
async function getById(id) {
    const [rows] = await db.query(
        'SELECT * FROM pass_packages WHERE pass_package_id = ?',
        [id]
    );
    return rows[0];
}

// Create a pass package
async function create(packageData) {
    const { name, hours, price, description, validity_days } = packageData;

    const [result] = await db.query(
        `INSERT INTO pass_packages
        (name, hours, price, description, validity_days)
        VALUES (?, ?, ?, ?, ?)`,
        [name, hours, price, description || null, validity_days]
    );

    return getById(result.insertId);
}

// Update a pass package
async function update(id, packageData) {
    const { name, hours, price, description, validity_days } = packageData;

    const [result] = await db.query(
        `UPDATE pass_packages
        SET name = ?, hours = ?, price = ?, description = ?, validity_days = ?
        WHERE pass_package_id = ?`,
        [name, hours, price, description || null, validity_days, id]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getById(id);
}

// Delete a pass package
async function remove(id) {
    const [result] = await db.query(
        'DELETE FROM pass_packages WHERE pass_package_id = ?',
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