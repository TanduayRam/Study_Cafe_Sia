const db = require('../config/databases');

// ---- REPORT 4 (Pontunilla): pass balance per member - INNER JOIN ----
// Joins users + member_passes + pass_packages.
// INNER JOIN keeps only members who own a pass.
// A LEFT JOIN from users would also list members with no pass (balance 0).
async function getAll() {
    const [rows] = await db.query(
        `SELECT mp.member_pass_id, u.user_id, u.name AS member_name,
                pp.name AS package_name, pp.hours AS package_hours,
                mp.remaining_hours, mp.expires_on,
                (mp.expires_on < UTC_DATE()) AS is_expired
         FROM member_passes mp
         INNER JOIN users u ON mp.user_id = u.user_id
         INNER JOIN pass_packages pp ON mp.package_id = pp.package_id
         ORDER BY u.name, mp.expires_on`
    );

    // MySQL gives 1 or 0. We turn it into true or false.
    for (let i = 0; i < rows.length; i++) {
        rows[i].is_expired = Boolean(rows[i].is_expired);
    }
    return rows;
}

module.exports = { getAll: getAll };