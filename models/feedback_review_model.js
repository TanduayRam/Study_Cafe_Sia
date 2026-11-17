const db = require('../config/databases');

const SELECT_REVIEW =
    'SELECT fr.review_id, fr.reservation_id, fr.user_id, u.name AS member_name, ' +
    'z.name AS zone_name, s.label AS seat_label, fr.rating, fr.comment, fr.created_at ' +
    'FROM feedback_reviews fr ' +
    'INNER JOIN users u ON fr.user_id = u.user_id ' +
    'INNER JOIN reservations r ON fr.reservation_id = r.reservation_id ' +
    'INNER JOIN seats s ON r.seat_id = s.seat_id ' +
    'INNER JOIN study_zones z ON s.zone_id = z.zone_id';

async function getAll(userId) {
    const [rows] = await db.query(
        SELECT_REVIEW + ' WHERE fr.user_id = ? ORDER BY fr.created_at DESC, fr.review_id DESC',
        [userId]
    );
    return rows;
}

async function getById(id, userId) {
    const [rows] = await db.query(
        SELECT_REVIEW + ' WHERE fr.review_id = ? AND fr.user_id = ?',
        [id, userId]
    );
    return rows[0];
}

async function getStats(userId) {
    const [summaryRows] = await db.query(
        `SELECT COUNT(*) AS total_reviews, COALESCE(AVG(rating), 0) AS average_rating
         FROM feedback_reviews WHERE user_id = ?`,
        [userId]
    );
    const [distributionRows] = await db.query(
        `SELECT rating, COUNT(*) AS count
         FROM feedback_reviews WHERE user_id = ?
         GROUP BY rating ORDER BY rating DESC`,
        [userId]
    );
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of distributionRows) distribution[row.rating] = Number(row.count);
    return {
        total_reviews: Number(summaryRows[0].total_reviews),
        average_rating: Number(Number(summaryRows[0].average_rating).toFixed(2)),
        rating_distribution: distribution
    };
}

async function getByReservation(reservationId) {
    const [rows] = await db.query(
        'SELECT review_id FROM feedback_reviews WHERE reservation_id = ?',
        [reservationId]
    );
    return rows[0];
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO feedback_reviews (reservation_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [data.reservation_id, data.user_id, data.rating, data.comment]
    );
    return getById(result.insertId, data.user_id);
}

async function update(id, userId, data) {
    const [result] = await db.query(
        'UPDATE feedback_reviews SET rating = ?, comment = ? WHERE review_id = ? AND user_id = ?',
        [data.rating, data.comment, id, userId]
    );
    if (result.affectedRows === 0) return null;
    return getById(id, userId);
}

async function remove(id, userId) {
    const [result] = await db.query(
        'DELETE FROM feedback_reviews WHERE review_id = ? AND user_id = ?',
        [id, userId]
    );
    return result.affectedRows > 0;
}

module.exports = { getAll, getById, getStats, getByReservation, create, update, remove };
