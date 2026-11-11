const engineModel = require('../models/engine_model');
const { sendSuccess, toDate } = require('../utils/http');

// POST /engine/check
// Runs the overstay, capacity and low-stock checks right now.
// Optional body { "now": "..." } lets the demo pretend it is a later time.
exports.check = async function (req, res, next) {
    try {
        const body = req.body || {};

        let now = new Date();
        if (body.now) {
            now = toDate(body.now, 'Simulated time');
        }

        const result = await engineModel.checkSessions(now);
        const total = result.capacity + result.overstay + result.low_stock;

        let message = 'Checks completed. No new alerts were needed.';
        if (total > 0) {
            message = 'Checks completed. ' + total + ' new alert(s) created.';
        }

        return sendSuccess(res, result, message);
    } catch (error) {
        next(error);
    }
};