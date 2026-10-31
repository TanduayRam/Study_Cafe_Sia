const db = require('../config/databases');

exports.getAll = async() => {
    const [rows] = await db.query(
        'SELECT u.id, u.name, u.email, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id'
    );
    return rows;
};

exports.findByEmail = async(email) => {
    const [rows] = await db.query(
        'SELECT u.*, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', [email]
    );
    return rows[0];
};

exports.create = async(name, email, password, roleId) => {
    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)', [name, email, password, roleId]
    );
    return result.insertId;
};

exports.remove = async(id) => {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
};