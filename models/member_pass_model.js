const db = require('../config/databases');

// Retrieves member passes with member and package details.
const SELECT_PASS =
    'SELECT mp.member_pass_id, mp.user_id, u.name AS member_name, ' +
    'mp.package_id, pp.name AS package_name, pp.hours AS package_hours, ' +
    'mp.remaining_hours, mp.expires_on, ' +
    '(mp.expires_on < UTC_DATE()) AS is_expired, mp.created_at ' +
    'FROM member_passes mp ' +
    'INNER JOIN users u ON mp.user_id = u.user_id ' +
    'INNER JOIN pass_packages pp ON mp.package_id = pp.package_id';

// Convert MySQL's 1 or 0 expiry value into true or false.
function fixRows(rows) {
    for (let i = 0; i < rows.length; i++) {
        rows[i].is_expired = Boolean(rows[i].is_expired);
    }

    return rows;
}

// Retrieves all member passes.
async function getAll() {
    const [rows] = await db.query(
        SELECT_PASS + ' ORDER BY mp.member_pass_id DESC'
    );

    return fixRows(rows);
}

// Retrieves one member pass by ID.
// An optional connection supports transaction-based operations.
async function getById(id, connection) {
    const executor = connection || db;

    const [rows] = await executor.query(
        SELECT_PASS + ' WHERE mp.member_pass_id = ?',
        [id]
    );

    return fixRows(rows)[0] || null;
}

// Retrieves all passes belonging to one member.
async function getByUserId(userId) {
    const [rows] = await db.query(
        SELECT_PASS +
        ' WHERE mp.user_id = ? ORDER BY mp.expires_on, mp.member_pass_id'
    , [userId]);

    return fixRows(rows);
}

// Assigns a package to a member.
async function assign(userId, pkg) {
    const [result] = await db.query(
        `INSERT INTO member_passes
            (user_id, package_id, remaining_hours, expires_on)
         VALUES (?, ?, ?, DATE_ADD(UTC_DATE(), INTERVAL ? DAY))`,
        [
            userId,
            pkg.package_id,
            pkg.hours,
            pkg.validity_days
        ]
    );

    return getById(result.insertId);
}

// Retrieves eligible passes and locks them during checkout.
// Earliest-expiring passes are returned first.
// Must be called inside an active transaction.
async function getUsableForUpdate(connection, userId) {
    const [rows] = await connection.query(
        `SELECT
            member_pass_id,
            user_id,
            remaining_hours,
            expires_on
         FROM member_passes
         WHERE user_id = ?
           AND remaining_hours > 0
           AND expires_on >= UTC_DATE()
         ORDER BY expires_on ASC, member_pass_id ASC
         FOR UPDATE`,
        [userId]
    );

    return rows;
}

// Deducts hours from a member pass inside the checkout transaction.
// Invalid or non-positive values are rejected.
async function deductHours(connection, passId, hours) {
    const amount = Number(hours);

    if (!Number.isFinite(amount) || amount <= 0) {
        return false;
    }

    const [result] = await connection.query(
        `UPDATE member_passes
         SET remaining_hours = remaining_hours - ?
         WHERE member_pass_id = ?
           AND remaining_hours >= ?
           AND expires_on >= UTC_DATE()`,
        [amount, passId, amount]
    );

    return result.affectedRows === 1;
}

// Deletes a member pass.
async function remove(id) {
    const [result] = await db.query(
        'DELETE FROM member_passes WHERE member_pass_id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getAll,
    getById,
    getByUserId,
    assign,
    remove,
    getUsableForUpdate,
    deductHours
};