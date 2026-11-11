const db = require('../config/databases');

const logAction = async ({
    userId = null,
    action,
    tableName,
    recordId = null,
    description = null
}, connection = db) => {

    if (!action || !tableName) {
        throw new Error('Action and table name are required.');
    }

    const [result] = await connection.query(
        `INSERT INTO audit_logs
        (user_id, action, table_name, record_id, description)
        VALUES (?, ?, ?, ?, ?)`,
        [userId, action, tableName, recordId, description]
    );

    return result.insertId;
};

module.exports = logAction;