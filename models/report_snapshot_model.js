const db = require('../config/databases');

// created_by_name shows "System" when created_by is empty.
const SELECT_SNAPSHOT =
    "SELECT sn.snapshot_id, sn.title, sn.report_data, sn.created_by, " +
    "COALESCE(u.name, 'System') AS created_by_name, sn.created_at " +
    "FROM report_snapshots sn LEFT JOIN users u ON sn.created_by = u.user_id";

async function getAll() {
    const [rows] = await db.query(SELECT_SNAPSHOT + ' ORDER BY sn.snapshot_id DESC');
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(SELECT_SNAPSHOT + ' WHERE sn.snapshot_id = ?', [id]);
    return rows[0];
}

// The report data is saved as JSON text.
async function create(title, reportData, userId) {
    const [result] = await db.query(
        'INSERT INTO report_snapshots (title, report_data, created_by) VALUES (?, ?, ?)',
        [title, JSON.stringify(reportData), userId]
    );
    return getById(result.insertId);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM report_snapshots WHERE snapshot_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { getAll: getAll, getById: getById, create: create, remove: remove };
