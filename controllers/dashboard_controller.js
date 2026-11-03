
const dashboardModel = require('../models/dashboard_model');

// GET DASHBOARD SUMMARY
const getDashboardSummary = async (req, res) => {
    try {
        const summary = await dashboardModel.getDashboardSummary();

        return res.status(200).json({
            success: true,
            message: 'Dashboard summary retrieved successfully.',
            data: summary
        });

    } catch (error) {
        console.error('Dashboard Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard summary.'
        });
    }
};

module.exports = {
    getDashboardSummary
};
