const db = require('../config/databases');

exports.getAll = async () => {
    const [rows] = await db.query(
        `SELECT al.*, u.name AS user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC`
    );
    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM audit_logs WHERE audit_log_id = ?',
        [id]
    );
    return rows[0];
};

exports.create = async (userId, action, tableName, recordId, description) => {
    const [result] = await db.query(
        `INSERT INTO audit_logs
         (user_id, action, table_name, record_id, description)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, action, tableName, recordId, description]
    );
    return result.insertId;
};

exports.remove = async (id) => {
    await db.query(
        'DELETE FROM audit_logs WHERE audit_log_id = ?',
        [id]
    );
};
