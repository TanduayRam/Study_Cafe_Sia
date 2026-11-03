const Review = require('../models/feedback_review_model');

exports.createReview = async (req, res) => {
    try {
        const { reservation_id, rating, comment } = req.body;
        const member_id = req.user.member_id;

        if (!reservation_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid review details' });
        }

        const id = await Review.createReview(
            reservation_id, member_id, rating, comment
        );

        res.status(201).json({ message: 'Review created', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getReviews = async (req, res) => {
    try {
        res.json(await Review.getAllReviews());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getReview = async (req, res) => {
    try {
        res.json(await Review.getReviewById(req.params.id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        await Review.updateReview(
            req.params.id, req.body.rating, req.body.comment
        );
        res.json({ message: 'Review updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await Review.deleteReview(req.params.id);
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};