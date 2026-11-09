const db = require('../config/databases');

const SELECT_REVIEW =
    'SELECT fr.review_id, fr.reservation_id, fr.user_id, u.name AS member_name, ' +
    'z.name AS zone_name, s.label AS seat_label, fr.rating, fr.comment, fr.created_at ' +
    'FROM feedback_reviews fr ' +
    'INNER JOIN users u ON fr.user_id = u.user_id ' +
    'INNER JOIN reservations r ON fr.reservation_id = r.reservation_id ' +
    'INNER JOIN seats s ON r.seat_id = s.seat_id ' +
    'INNER JOIN study_zones z ON s.zone_id = z.zone_id';

async function getAll() {
    const [rows] = await db.query(SELECT_REVIEW + ' ORDER BY fr.created_at DESC, fr.review_id DESC');
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(SELECT_REVIEW + ' WHERE fr.review_id = ?', [id]);
    return rows[0];
}

// Is there already a review for this reservation?
async function getByReservation(reservationId) {
    const [rows] = await db.query('SELECT review_id FROM feedback_reviews WHERE reservation_id = ?', [reservationId]);
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO feedback_reviews (reservation_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [data.reservation_id, data.user_id, data.rating, data.comment]
    );
    return getById(result.insertId);
}

async function update(id, data) {
    const [result] = await db.query(
        'UPDATE feedback_reviews SET rating = ?, comment = ? WHERE review_id = ?',
        [data.rating, data.comment, id]
    );
    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM feedback_reviews WHERE review_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    getAll: getAll,
    getById: getById,
    getByReservation: getByReservation,
    create: create,
    update: update,
    remove: remove
};
