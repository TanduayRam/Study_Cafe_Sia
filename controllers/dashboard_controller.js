const dashboardModel = require('../models/dashboard_model');
const { sendSuccess } = require('../utils/http');

// GET /dashboard/summary
exports.getSummary = async function (req, res, next) {
    try {
        const summary = await dashboardModel.getSummary();
        return sendSuccess(res, summary, 'Dashboard summary retrieved.');
    } catch (error) {
        next(error);
    }
};
