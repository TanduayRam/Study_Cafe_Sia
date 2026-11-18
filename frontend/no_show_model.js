const db = require('../config/databases');
const sessionLogsModel = require('./session_logs_model');
const logAction = require('../utils/audit_logger');

async function releaseNoShows(now = new Date()) {
    const currentTime = new Date(now);

    if (isNaN(currentTime.getTime())) {
        throw new Error('Invalid date and time.');
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [reservations] = await connection.query(
            `SELECT r.reservation_id, r.user_id, r.seat_id,
                    r.start_time, r.end_time, s.zone_id
             FROM reservations r
             INNER JOIN seats s ON r.seat_id = s.seat_id
             WHERE r.status = 'Confirmed'
               AND r.start_time <= DATE_SUB(?, INTERVAL 15 MINUTE)
             FOR UPDATE`,
            [currentTime]
        );

        const releasedReservations = [];

        for (const reservation of reservations) {
            const [result] = await connection.query(
                `UPDATE reservations
                 SET status = 'NoShow'
                 WHERE reservation_id = ?
                   AND status = 'Confirmed'`,
                [reservation.reservation_id]
            );

            if (result.affectedRows === 0) {
                continue;
            }

            await sessionLogsModel.recordNoShow(
                connection,
                {
                    reservation_id: reservation.reservation_id,
                    user_id: reservation.user_id,
                    zone_id: reservation.zone_id,
                    seat_id: reservation.seat_id,
                    start_time: reservation.start_time,
                    end_time: reservation.end_time
                },
                currentTime
            );

            await logAction(
                null,
                'NO_SHOW',
                'reservations',
                reservation.reservation_id,
                'Reservation automatically marked as NoShow after the 15-minute grace period.',
                connection
            );

            releasedReservations.push({
                reservation_id: reservation.reservation_id,
                user_id: reservation.user_id,
                seat_id: reservation.seat_id
            });
        }

        await connection.commit();

        return releasedReservations;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    releaseNoShows
};