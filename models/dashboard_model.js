const db = require('../config/databases');

const getDashboardSummary = async () => {

    const [activeSessions] = await db.query(`
        SELECT COUNT(*) AS total
        FROM session_logs
        WHERE end_time IS NULL
          AND status = 'Active'
    `);

    const [availableSeats] = await db.query(`
        SELECT COUNT(*) AS total
        FROM seats
        WHERE status = 'Available'
    `);

    const [openAlerts] = await db.query(`
        SELECT COUNT(*) AS total
        FROM alerts
        WHERE status = 'Open'
    `);

    const [todaysRevenue] = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) AS total
        FROM payments
        WHERE DATE(paid_at) = CURDATE()
          AND status = 'Paid'
    `);

    const [averageRating] = await db.query(`
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