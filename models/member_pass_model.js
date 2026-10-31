const db = require('../config/databases');

// Assign a pass package to a member
async function assignPass(userId, packageId) {
    // Get the selected package
    const [packages] = await db.query(
        'SELECT * FROM pass_packages WHERE pass_package_id = ?',
        [packageId]
    );

    if (packages.length === 0) {
        throw new Error('Pass package not found.');
    }

    const selectedPackage = packages[0];

    // Calculate expiration date
    const [result] = await db.query(
        `INSERT INTO member_passes
        (user_id, pass_package_id, remaining_hours, expires_on)
        VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
        [
            userId,
            packageId,
            selectedPackage.hours,
            selectedPackage.validity_days
        ]
    );

    return getById(result.insertId);
}

// Get one member pass
async function getById(id) {
    const [rows] = await db.query(
        'SELECT * FROM member_passes WHERE member_pass_id = ?',
        [id]
    );

    return rows[0];
}

// Get all passes belonging to a member
async function getByUserId(userId) {
    const [rows] = await db.query(
        `SELECT mp.*, pp.name AS package_name
         FROM member_passes mp
         INNER JOIN pass_packages pp
         ON mp.pass_package_id = pp.pass_package_id
         WHERE mp.user_id = ?
         ORDER BY mp.member_pass_id DESC`,
        [userId]
    );

    return rows;
}

module.exports = {
    assignPass,
    getById,
    getByUserId
};