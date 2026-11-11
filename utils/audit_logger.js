const db = require('../config/databases');

// Saves one line in the audit_logs table: who did what, to which record.
// userId = null means the System did it automatically.
// "connection" is optional. When we are inside a transaction we pass that
// connection so the audit line is saved together with the change.
async function logAction(userId, action, tableName, recordId, details, connection) {
    if (!connection) connection = db;
    if (!recordId) recordId = null;
    if (!details) details = null;
    if (details !== null) details = String(details).slice(0, 500);

    const [result] = await connection.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)',
        [userId || null, action, tableName, recordId, details]
    );
    return result.insertId;
}

module.exports = logAction;