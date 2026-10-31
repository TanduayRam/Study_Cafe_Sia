const db = require('../config/javier_database');

const createSnapshot = async (title, reportData) => {
    const sql = `
        INSERT INTO report_snapshots (title, report_data)
        VALUES (?, ?)
    `;

    const [result] = await db.execute(sql, [
        title,
        JSON.stringify(reportData)
    ]);

    return result.insertId;
};

const getAllSnapshots = async () => {
    const sql = `
        SELECT * FROM report_snapshots
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(sql);
    return rows;
};

const deleteSnapshot = async (snapshotId) => {
    const sql = `
        DELETE FROM report_snapshots
        WHERE snapshot_id = ?
    `;

    const [result] = await db.execute(sql, [snapshotId]);
    return result.affectedRows;
};

module.exports = {
    createSnapshot,
    getAllSnapshots,
    deleteSnapshot
};