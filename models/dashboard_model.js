
const db = require('../config/javier_database');

const getDashboardSummary = async () => {

    const [activeSessions] = await db.execute(`
        SELECT COUNT(*) AS total
        FROM session_logs
        WHERE ended_at IS NULL
    `);

    const [availableSeats] = await db.execute(`
        SELECT COUNT(*) AS total
        FROM seats
        WHERE status = 'available'
    `);

    const [openAlerts] = await db.execute(`
        SELECT COUNT(*) AS total
        FROM alerts
        WHERE is_resolved = FALSE
    `);

    const [todaysRevenue] = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE DATE(paid_at) = CURDATE()
    `);

    const [averageRating] = await db.execute(`
        SELECT COALESCE(AVG(rating), 0) AS average
        FROM feedback_reviews
    `);

    return {
        active_sessions: activeSessions[0].total,
        available_seats: availableSeats[0].total,
        open_alerts: openAlerts[0].total,
        low_stock_items: null,
        todays_revenue: Number(todaysRevenue[0].total),
        average_rating: Number(averageRating[0].average),

        unavailable_metrics: [
            'low_stock_items'
        ]
    };
};

module.exports = {
    getDashboardSummary
};
