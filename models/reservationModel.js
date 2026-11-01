const db = require('../config/databases');

// Get all reservations
const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM reservations'
    );
    return rows;
};

// Get one reservation by ID
const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM reservations WHERE reservation_id = ?',
        [id]
    );
    return rows[0];
};

// Create a new reservation
const create = async (reservation) => {
    const {
        user_id,
        seat_id,
        start_time,
        end_time
    } = reservation;

    const [result] = await db.query(
        `INSERT INTO reservations
        (user_id, seat_id, start_time, end_time)
        VALUES (?, ?, ?, ?)`,
        [user_id, seat_id, start_time, end_time]
    );

    return getById(result.insertId);
};

// Update an existing reservation
const update = async (id, reservation) => {
    const {
        user_id,
        seat_id,
        start_time,
        end_time,
        status
    } = reservation;

    const [result] = await db.query(
        `UPDATE reservations
        SET user_id = ?, seat_id = ?, start_time = ?,
            end_time = ?, status = ?
        WHERE reservation_id = ?`,
        [user_id, seat_id, start_time, end_time, status, id]
    );

    return result.affectedRows;
};

// Delete a reservation
const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM reservations WHERE reservation_id = ?',
        [id]
    );

    return result.affectedRows;
};

// Export functions so the controller can use them
module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
