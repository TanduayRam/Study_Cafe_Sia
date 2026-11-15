const db = require('../config/databases');

// A member pass = a package that was given to a member, with the hours that are left.
const SELECT_PASS =
    'SELECT mp.member_pass_id, mp.user_id, u.name AS member_name, ' +
    'mp.package_id, pp.name AS package_name, pp.hours AS package_hours, ' +
    'mp.remaining_hours, mp.expires_on, (mp.expires_on < UTC_DATE()) AS is_expired, mp.created_at ' +
    'FROM member_passes mp ' +
    'INNER JOIN users u ON mp.user_id = u.user_id ' +
    'INNER JOIN pass_packages pp ON mp.package_id = pp.package_id';

// MySQL gives 1 or 0 for is_expired. We turn it into true or false.
function fixRows(rows) {
    for (let i = 0; i < rows.length; i++) {
        rows[i].is_expired = Boolean(rows[i].is_expired);
    }
    return rows;
}

async function getAll() {
    const [rows] = await db.query(SELECT_PASS + ' ORDER BY mp.member_pass_id DESC');
    return fixRows(rows);
}

 async function getById(id) {
    const [rows] = await db.query(SELECT_PASS + ' WHERE mp.member_pass_id = ?', [id]);
    return fixRows(rows)[0];
}

 async function getByUserId(userId) {
    const [rows] = await db.query(
        SELECT_PASS + ' WHERE mp.user_id = ? ORDER BY mp.expires_on, mp.member_pass_id',
        [userId]
    );
    return fixRows(rows);
}

// Gives a package to a member: copies the package hours and sets the expiry date.
async function assign(userId, pkg) {
    const [result] = await db.query(
        `INSERT INTO member_passes (user_id, package_id, remaining_hours, expires_on)
         VALUES (?, ?, ?, DATE_ADD(UTC_DATE(), INTERVAL ? DAY))`,
        [userId, pkg.package_id, pkg.hours, pkg.validity_days]
    );
    return getById(result.insertId);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM member_passes WHERE member_pass_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getByUserId: getByUserId,
    assign: assign,
    remove: remove
};