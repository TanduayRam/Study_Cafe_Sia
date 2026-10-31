
const db = require('../config/databases');

const SYSTEM_USER_ID = 7;

async function createAlert(connection, alertType, message) {
    const [existing] = await connection.query(
        `SELECT alert_id
         FROM alerts
         WHERE alert_type = ?
         AND message = ?
         AND status = 'Open'
         LIMIT 1
         FOR UPDATE`,
        [alertType, message]
    );

    if (existing.length > 0) {
        return null;
    }

    const [result] = await connection.query(
        `INSERT INTO alerts
         (user_id, message, alert_type, status)
         VALUES (?, ?, ?, 'Open')`,
        [SYSTEM_USER_ID, message, alertType]
    );

    await connection.query(
        `INSERT INTO audit_logs
         (user_id, action, table_name, record_id, description)
         VALUES (?, 'CREATE', 'alerts', ?, ?)`,
        [
            SYSTEM_USER_ID,
            result.insertId,
            `System automatically created a ${alertType} alert: ${message}`
        ]
    );

    return result.insertId;
}

exports.checkSessions = async () => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let capacityAlerts = 0;
        let stockAlerts = 0;
        let overstayAlerts = 0;

        const [zones] = await connection.query(
            `SELECT
                z.study_zone_id,
                z.name,
                z.capacity,
                COUNT(
                    CASE WHEN s.status = 'Occupied'
                    THEN 1 END
                ) AS occupied_seats
             FROM study_zones z
             LEFT JOIN seats s
                ON z.study_zone_id = s.study_zone_id
             GROUP BY
                z.study_zone_id,
                z.name,
                z.capacity`
        );

        for (const zone of zones) {
            const occupancy = Number(zone.occupied_seats);
            const capacity = Number(zone.capacity);

            if (capacity > 0 && occupancy / capacity >= 0.90) {
                const message =
                    `${zone.name} has reached ${Math.round(
                        (occupancy / capacity) * 100
                    )}% capacity (${occupancy}/${capacity} seats).`;

                const alertId = await createAlert(
                    connection,
                    'Capacity',
                    message
                );

                if (alertId) capacityAlerts++;
            }
        }

        const [overstayingSessions] = await connection.query(
            `SELECT
                sl.session_log_id,
                sl.user_id,
                sl.study_zone_id,
                sl.expected_end_time,
                z.name AS zone_name,
                z.capacity,
                COUNT(
                    CASE WHEN s.status = 'Occupied'
                    THEN 1 END
                ) AS occupied_seats
             FROM session_logs sl
             JOIN study_zones z
                ON sl.study_zone_id = z.study_zone_id
             LEFT JOIN seats s
                ON z.study_zone_id = s.study_zone_id
             WHERE sl.status = 'Active'
               AND sl.expected_end_time IS NOT NULL
               AND sl.expected_end_time <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
             GROUP BY
                sl.session_log_id,
                sl.user_id,
                sl.study_zone_id,
                sl.expected_end_time,
                z.name,
                z.capacity
             HAVING z.capacity > 0
                AND occupied_seats / z.capacity >= 0.80`
        );

        for (const session of overstayingSessions) {
            const message =
                `Session ${session.session_log_id} is overstaying in ${session.zone_name}. Expected end time passed by at least 10 minutes.`;

            const alertId = await createAlert(
                connection,
                'Overstay',
                message
            );

            if (alertId) overstayAlerts++;
        }

        const [items] = await connection.query(
            `SELECT menu_item_id, name, stock, reorder_level
             FROM menu_items
             WHERE stock <= reorder_level`
        );

        for (const item of items) {
            const message =
                `${item.name} is low in stock. Current stock: ${item.stock}. Reorder level: ${item.reorder_level}.`;

            const alertId = await createAlert(
                connection,
                'Low Stock',
                message
            );

            if (alertId) stockAlerts++;
        }

        await connection.commit();

        return {
            success: true,
            capacityAlerts,
            overstayAlerts,
            stockAlerts,
            message: 'Monitoring checks completed.'
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};
