const db = require('../config/javier_database');

const createReview = async (reservationId, memberId, rating, comment) => {
    const sql = `
        INSERT INTO feedback_reviews
        (reservation_id, member_id, rating, comment)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        reservationId,
        memberId,
        rating,
        comment
    ]);

    return result.insertId;
};

const getAllReviews = async () => {
    const sql = `
        SELECT * FROM feedback_reviews
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(sql);
    return rows;
};

// GET REVIEW BY ID
const getReviewById = async (reviewId) => {
    const sql = `
        SELECT * FROM feedback_reviews
        WHERE review_id = ?
    `;

    const [rows] = await db.execute(sql, [reviewId]);
    return rows[0];
};

const updateReview = async (reviewId, rating, comment) => {
    const sql = `
        UPDATE feedback_reviews
        SET rating = ?, comment = ?
        WHERE review_id = ?
    `;

    const [result] = await db.execute(sql, [
        rating,
        comment,
        reviewId
    ]);

    return result.affectedRows;
};


const deleteReview = async (reviewId) => {
    const sql = `
        DELETE FROM feedback_reviews
        WHERE review_id = ?
    `;

    const [result] = await db.execute(sql, [reviewId]);
    return result.affectedRows;
};

module.exports = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview
};