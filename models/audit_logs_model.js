const db = require('../config/databases');

// LEFT JOIN keeps automatic rows (user_id is empty). They are shown as "System".
const SELECT_AUDIT =
    "SELECT al.audit_log_id, al.user_id, COALESCE(u.name, 'System') AS user_name, " +
    "al.action, al.table_name, al.record_id, al.details, al.created_at " +
    "FROM audit_logs al LEFT JOIN users u ON al.user_id = u.user_id";

// filters can have table_name, action and limit.
async function getAll(filters) {
    let sql = SELECT_AUDIT;
    const conditions = [];
    const values = [];

    if (filters.table_name) {
        conditions.push('al.table_name = ?');
        values.push(filters.table_name);
    }
    if (filters.action) {
        conditions.push('al.action = ?');
        values.push(filters.action);
    }
    if (conditions.length > 0) {
        sql = sql + ' WHERE ' + conditions.join(' AND ');
    }

    sql = sql + ' ORDER BY al.created_at DESC, al.audit_log_id DESC LIMIT ?';
    values.push(filters.limit);

    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(SELECT_AUDIT + ' WHERE al.audit_log_id = ?', [id]);
    return rows[0];
}

module.exports = { getAll: getAll, getById: getById };