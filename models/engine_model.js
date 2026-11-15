const db = require('../config/databases');
const alertModel = require('./alerts_model');

// The rules agreed by the group:
const OVERSTAY_MINUTES = 10;        // a session is "overstaying" 10 minutes after its end time...
const OVERSTAY_ZONE_PERCENT = 80;   // ...but only if its zone is at least 80% full
const CAPACITY_PERCENT = 90;        // a zone at 90% full gets a Capacity alert

// For every zone: how many seats are Occupied compared to its capacity.
async function getZoneOccupancy(connection) {
    const [zones] = await connection.query(
        `SELECT z.zone_id, z.name, z.capacity,
                COUNT(CASE WHEN s.status = 'Occupied' THEN 1 END) AS occupied
         FROM study_zones z
         LEFT JOIN seats s ON s.zone_id = z.zone_id
         GROUP BY z.zone_id, z.name, z.capacity`
    );

    for (let i = 0; i < zones.length; i++) {
        zones[i].percent = 0;
        if (zones[i].capacity > 0) {
            zones[i].percent = (zones[i].occupied / zones[i].capacity) * 100;
        }
    }
    return zones;
}

// Finds one zone in the list by its id.
function findZone(zones, zoneId) {
    for (let i = 0; i < zones.length; i++) {
        if (zones[i].zone_id === zoneId) {
            return zones[i];
        }
    }
    return null;
}

// Runs all three checks (capacity, overstay, low stock) in ONE transaction.
// New alerts are created by the System (user id empty).
async function checkSessions(now) {
    if (!now) now = new Date();

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const result = { capacity: 0, overstay: 0, low_stock: 0, created_alert_ids: [] };
        const zones = await getZoneOccupancy(connection);

        // 1. Capacity alert: a zone is 90% full or more.
        for (let i = 0; i < zones.length; i++) {
            const zone = zones[i];

            if (zone.percent >= CAPACITY_PERCENT) {
                const alertId = await alertModel.createIfNew(connection, {
                    alert_type: 'Capacity',
                    zone_id: zone.zone_id,
                    message: zone.name + ' is ' + Math.round(zone.percent) + '% full (' + zone.occupied + '/' + zone.capacity + ' seats).'
                }, null);

                if (alertId) {
                    result.capacity = result.capacity + 1;
                    result.created_alert_ids.push(alertId);
                }
            }
        }

        // 2. Overstay alert: an Active session is 10+ minutes past its end time AND its zone is 80%+ full.
        const [sessions] = await connection.query(
            `SELECT sl.session_log_id, sl.zone_id, sl.seat_id, sl.expected_end_time, s.label AS seat_label
             FROM session_logs sl
             LEFT JOIN seats s ON sl.seat_id = s.seat_id
             WHERE sl.status = 'Active'
               AND sl.expected_end_time IS NOT NULL
               AND sl.expected_end_time <= DATE_SUB(?, INTERVAL ${OVERSTAY_MINUTES} MINUTE)`,
            [now]
        );

        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            const zone = findZone(zones, session.zone_id);

            if (zone && zone.percent >= OVERSTAY_ZONE_PERCENT) {
                let seatName = 'A seat';
                if (session.seat_label) seatName = session.seat_label;

                const alertId = await alertModel.createIfNew(connection, {
                    alert_type: 'Overstay',
                    zone_id: session.zone_id,
                    seat_id: session.seat_id,
                    message: seatName + ' in ' + zone.name + ' is past its end time by ' + OVERSTAY_MINUTES + '+ minutes while the zone is ' + Math.round(zone.percent) + '% full.'
                }, null);

                if (alertId) {
                    result.overstay = result.overstay + 1;
                    result.created_alert_ids.push(alertId);
                }
            }
        }

        // 3. Low stock alert: stock is at or below the reorder level.
        const [items] = await connection.query(
            'SELECT item_id, name, stock, reorder_level FROM menu_items WHERE stock <= reorder_level'
        );

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            const alertId = await alertModel.createIfNew(connection, {
                alert_type: 'LowStock',
                item_id: item.item_id,
                message: item.name + ' is low: ' + item.stock + ' left (reorder level ' + item.reorder_level + ').'
            }, null);

            if (alertId) {
                result.low_stock = result.low_stock + 1;
                result.created_alert_ids.push(alertId);
            }
        }

        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { checkSessions: checkSessions };