const Review = require('../models/feedback_review_model');
const reservationModel = require('../models/reservationModel');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

// Checks the rating (1 to 5) and the comment. Returns clean values.
function cleanRatingAndComment(body) {
    const rating = Number(body.rating);

    if (isBlank(body.rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw createError(400, 'Rating must be a whole number from 1 to 5.');
    }
    if (isBlank(body.comment) === false && String(body.comment).length > 500) {
        throw createError(400, 'Comment must be 500 characters or fewer.');
    }

    let comment = null;
    if (isBlank(body.comment) === false) {
        comment = String(body.comment).trim();
    }

    return { rating: rating, comment: comment };
}

// Finds the review from the address. Throws 404 if it does not exist.
async function loadReview(req) {
    const review = await Review.getById(toId(req.params.id, 'Review ID'));

    if (!review) {
        throw createError(404, 'Review not found.');
    }
    return review;
}

// Only the person who wrote the review, or an Admin, may change or delete it.
function checkCanChange(review, user) {
    if (user.role !== 'Admin' && review.user_id !== user.user_id) {
        throw createError(403, 'You can only change your own reviews.');
    }
}

// GET /reviews
exports.getAll = async function (req, res, next) {
    try {
        const reviews = await Review.getAll();
        return sendSuccess(res, reviews, 'Reviews retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /reviews/:id
exports.getById = async function (req, res, next) {
    try {
        const review = await loadReview(req);
        return sendSuccess(res, review, 'Review retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /reviews   with { reservation_id, rating, comment }
// The reviewer is the logged-in user (taken from the token).
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        const reservationId = toId(body.reservation_id, 'Reservation ID');
        const clean = cleanRatingAndComment(body);

        const reservation = await reservationModel.getById(reservationId);

        if (!reservation) {
            throw createError(404, 'Reservation not found.');
        }
        if (req.user.role === 'Member' && reservation.user_id !== req.user.user_id) {
            throw createError(403, 'You can only review your own reservations.');
        }
        if (reservation.status !== 'Completed') {
            throw createError(400, 'You can only review a Completed reservation.');
        }

        // One review per reservation.
        const already = await Review.getByReservation(reservationId);
        if (already) {
            throw createError(400, 'This reservation already has a review.');
        }

        const review = await Review.create({
            reservation_id: reservationId,
            user_id: req.user.user_id,
            rating: clean.rating,
            comment: clean.comment
        });

        return sendSuccess(res, review, 'Thank you! Your review was saved.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /reviews/:id
exports.update = async function (req, res, next) {
    try {
        const review = await loadReview(req);
        checkCanChange(review, req.user);

        const clean = cleanRatingAndComment(req.body || {});
        const updated = await Review.update(review.review_id, clean);

        return sendSuccess(res, updated, 'Review updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /reviews/:id
exports.remove = async function (req, res, next) {
    try {
        const review = await loadReview(req);
        checkCanChange(review, req.user);

        await Review.remove(review.review_id);
        return sendSuccess(res, { review_id: review.review_id }, 'Review deleted.');
    } catch (error) {
        next(error);
    }
};
