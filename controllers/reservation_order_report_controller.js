const reportModel = require('../models/reservation_order_report_model');

// Get reservation-orders report.
async function getAll(req, res) {
    try {
        const reservations = await reportModel.getAll();

        return res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });

    } catch (error) {
        console.error('Reservation-orders report error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve reservation-orders report.'
        });
    }
}

module.exports = {
    getAll
};
