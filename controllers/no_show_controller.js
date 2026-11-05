const noShowModel = require('../models/no_show_model');

async function releaseNoShows(req, res) {
    try {
        // Use supplied time for testing, or current time.
        const now = req.body?.now
            ? new Date(req.body.now)
            : new Date();

        if (isNaN(now.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date and time.'
            });
        }

        const releasedReservations =
            await noShowModel.releaseNoShows(now);

        return res.status(200).json({
            success: true,
            message: 'No-show reservations released successfully.',
            count: releasedReservations.length,
            data: releasedReservations
        });

    } catch (error) {
        console.error('No-show release error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to release no-show reservations.'
        });
    }
}

module.exports = {
    releaseNoShows
};