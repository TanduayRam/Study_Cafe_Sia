const billingModel = require('../models/billing_model');
const noShowModel = require('../models/no_show_model');
const { sendSuccess, toId, toDate } = require('../utils/http');

// GET /billing/compute/:reservationId?checkout_time=...
// Shows the bill. It does not save anything.
exports.computeBill = async function (req, res, next) {
    try {
        const reservationId = toId(req.params.reservationId, 'Reservation ID');

        let at = new Date();
        if (req.query.checkout_time) {
            at = toDate(req.query.checkout_time, 'Checkout time');
        }

        const bill = await billingModel.computeBill(reservationId, at);
        return sendSuccess(res, bill, 'Bill calculated.');
    } catch (error) {
        next(error);
    }
};

// POST /billing/release-no-shows   with optional { "now": "pretend time" }
exports.releaseNoShows = async function (req, res, next) {
    try {
        const body = req.body || {};

        let now = new Date();
        if (body.now) {
            now = toDate(body.now, 'Simulated time');
        }

        const released = await noShowModel.releaseNoShows(now);

        let message = 'No reservations needed to be released.';
        if (released.length > 0) {
            message = released.length + ' reservation(s) marked as No-Show and released.';
        }

        return sendSuccess(res, { released_count: released.length, released: released }, message);
    } catch (error) {
        next(error);
    }
};