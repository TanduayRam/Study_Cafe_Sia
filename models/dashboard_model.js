const db = require('../config/databases');

// Collects the numbers for the dashboard. Every number falls back to 0,
// so an empty database never crashes the page.
async function getSummary() {
    const [sessions] = await db.query("SELECT COUNT(*) AS total FROM session_logs WHERE status = 'Active'");
    const [seats] = await db.query("SELECT COUNT(*) AS total FROM seats WHERE status = 'Available'");
    const [alerts] = await db.query("SELECT COUNT(*) AS total FROM alerts WHERE status = 'Open'");
    const [lowStock] = await db.query('SELECT COUNT(*) AS total FROM menu_items WHERE stock <= reorder_level');
    const [revenue] = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total, COALESCE(SUM(cash_amount), 0) AS cash
         FROM payments
         WHERE status = 'Paid' AND DATE(paid_at) = UTC_DATE()`
    );
    const [rating] = await db.query('SELECT COALESCE(ROUND(AVG(rating), 2), 0) AS average FROM feedback_reviews');

    // Occupancy of each zone.
    const [zones] = await db.query(
        `SELECT z.zone_id, z.name, z.capacity,
                COUNT(CASE WHEN s.status = 'Occupied' THEN 1 END) AS occupied
         FROM study_zones z
         LEFT JOIN seats s ON s.zone_id = z.zone_id
         GROUP BY z.zone_id, z.name, z.capacity
         ORDER BY z.zone_id`
    );

    const zoneList = [];
    for (let i = 0; i < zones.length; i++) {
        const occupied = Number(zones[i].occupied);
        let percent = 0;
        if (zones[i].capacity > 0) {
            percent = Math.round((occupied / zones[i].capacity) * 100);
        }

        zoneList.push({
            zone_id: zones[i].zone_id,
            name: zones[i].name,
            capacity: zones[i].capacity,
            occupied: occupied,
            percent: percent
        });
    }

    return {
        active_sessions: Number(sessions[0].total),
        available_seats: Number(seats[0].total),
        open_alerts: Number(alerts[0].total),
        low_stock_items: Number(lowStock[0].total),
        todays_revenue: Number(revenue[0].total),
        todays_cash: Number(revenue[0].cash),
        average_rating: Number(rating[0].average),
        zone_occupancy: zoneList
    };
}

module.exports = { getSummary: getSummary };
