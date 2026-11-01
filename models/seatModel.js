
const db = require('../config/databases');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM seats'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM seats WHERE seat_id = ?',
        [id]
    );
    return rows[0];
};

const create = async (seat) => {
    const { study_zone_id, label, status } = seat;

    const [result] = await db.query(
        `INSERT INTO seats
        (study_zone_id, label, status)
        VALUES (?, ?, ?)`,
        [study_zone_id, label, status]
    );

    return {
        seat_id: result.insertId,
        ...seat
    };
};

const update = async (id, seat) => {
    const { study_zone_id, label, status } = seat;

    const [result] = await db.query(
        `UPDATE seats
        SET study_zone_id = ?, label = ?, status = ?
        WHERE seat_id = ?`,
        [study_zone_id, label, status, id]
    );

    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM seats WHERE seat_id = ?',
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
