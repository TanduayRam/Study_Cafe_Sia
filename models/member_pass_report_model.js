const db = require('../config/databases');

// Get all member passes with user and package information.
async function getAll() {
const query = `
    SELECT
    mp.member_pass_id,
    mp.user_id,
    u.name AS member_name,
    mp.pass_package_id,
    pp.name AS package_name,
    pp.hours AS package_hours,
    pp.price AS package_price,
    mp.remaining_hours,
    mp.expires_on,
    mp.created_at
    FROM member_passes AS mp
    INNER JOIN users AS u
    ON mp.user_id = u.id
    INNER JOIN pass_packages AS pp
    ON mp.pass_package_id = pp.pass_package_id
    ORDER BY mp.member_pass_id DESC
`;

    const [rows] = await db.query(query);
    return rows;
}  

module.exports = {
    getAll
};
