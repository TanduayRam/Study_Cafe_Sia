const db = require('../config/databases');

 async function getAll() {
    const [rows] = await db.query('SELECT * FROM pass_packages ORDER BY package_id');
    return rows;
}

 async function getById(id) {
    const [rows] = await db.query('SELECT * FROM pass_packages WHERE package_id = ?', [id]);
    return rows[0];
}

 async function create(data) {
    const [result] = await db.query(
        'INSERT INTO pass_packages (name, hours, price, description, validity_days) VALUES (?, ?, ?, ?, ?)',
        [data.name, data.hours, data.price, data.description, data.validity_days]
     );
     return getById(result.insertId);
 }

async function update(id, data) {
    const [result] = await db.query(
        'UPDATE pass_packages SET name = ?, hours = ?, price = ?, description = ?, validity_days = ? WHERE package_id = ?',
        [data.name, data.hours, data.price, data.description, data.validity_days, id]
     );
     if (result.affectedRows === 0) {
        return null;
     }
    return getById(id);
}

 async function remove(id) {
    const [result] = await db.query('DELETE FROM pass_packages WHERE package_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { getAll: getAll, getById: getById, create: create, update: update, remove: remove };