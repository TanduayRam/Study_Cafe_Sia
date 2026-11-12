const db = require('../config/databases');

// The columns we are allowed to send to the screen (never the password).
const SAFE_COLUMNS = 'u.user_id, u.name, u.email, u.role_id, r.name AS role, u.is_active, u.created_at';

// INNER JOIN: every user must have a role, so we join users with roles.
async function getAll() {
    const [rows] = await db.query(
        'SELECT ' + SAFE_COLUMNS + ' FROM users u INNER JOIN roles r ON u.role_id = r.role_id ORDER BY u.user_id'
    );
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(
        'SELECT ' + SAFE_COLUMNS + ' FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?', [id]
    );
    return rows[0];
}

// This one includes the password hash. Only the login code uses it.
async function findByEmail(email) {
    const [rows] = await db.query(
        'SELECT u.*, r.name AS role FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?', [email]
    );
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)', [data.name, data.email, data.password, data.role_id]
    );
    return getById(result.insertId);
}

// The password is only changed when a new one is given.
async function update(id, data) {
    let sql = 'UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ?';
    const values = [data.name, data.email, data.role_id, data.is_active ? 1 : 0];

    if (data.password) {
        sql = sql + ', password = ?';
        values.push(data.password);
    }

    sql = sql + ' WHERE user_id = ?';
    values.push(id);

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}

// Tries to delete. If other tables use this user, we deactivate instead.
// Returns 'deleted', 'deactivated' or 'missing'.
async function remove(id) {
    try {
        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
        if (result.affectedRows > 0) {
            return 'deleted';
        }
        return 'missing';
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            await db.query('UPDATE users SET is_active = 0 WHERE user_id = ?', [id]);
            return 'deactivated';
        }
        throw error;
    }
}

// Only active members (used by the "choose a member" dropdowns).
async function getActiveMembers() {
    const [rows] = await db.query(
        `SELECT u.user_id, u.name, u.email
         FROM users u INNER JOIN roles r ON u.role_id = r.role_id
         WHERE r.name = 'Member' AND u.is_active = 1
         ORDER BY u.name`
    );
    return rows;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    findByEmail: findByEmail,
    create: create,
    update: update,
    remove: remove,
    getActiveMembers: getActiveMembers
};