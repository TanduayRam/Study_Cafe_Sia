const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

const SYSTEM_USER_ID = 7;

async function releaseNoShows(now = new Date()) {
    const currentTime = new Date(now);

    if (isNaN(currentTime.getTime())) {
        throw new Error('Invalid date and time.');
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Find confirmed reservations that are at least 15 minutes late.
        const [reservations] = await connection.query(
            `SELECT reservation_id, user_id, seat_id
             FROM reservations
             WHERE status = 'Confirmed'
               AND start_time <= DATE_SUB(?, INTERVAL 15 MINUTE)
             FOR UPDATE`,
            [currentTime]
        );

        const releasedReservations = [];

        for (const reservation of reservations) {
            // Mark the reservation as No-Show.
            const [reservationResult] = await connection.query(
                `UPDATE reservations
                 SET status = 'No-Show'
                 WHERE reservation_id = ?
                   AND status = 'Confirmed'`,
                [reservation.reservation_id]
            );

            if (reservationResult.affectedRows === 0) {
                continue;
            }

            // Release the reserved seat.
            const [seatResult] = await connection.query(
                `UPDATE seats
                 SET status = 'Available'
                 WHERE seat_id = ?`,
                [reservation.seat_id]
            );

            // Record the No-Show action.
            await logAction({
                userId: SYSTEM_USER_ID,
                action: 'NO_SHOW',
                tableName: 'reservations',
                recordId: reservation.reservation_id,
                description: `Reservation ${reservation.reservation_id} was automatically marked as No-Show after the 15-minute grace period.`
            }, connection);

            // Record the seat release if the seat was updated.
            if (seatResult.affectedRows > 0) {
                await logAction({
                    userId: SYSTEM_USER_ID,
                    action: 'RELEASE_SEAT',
                    tableName: 'seats',
                    recordId: reservation.seat_id,
                    description: `Seat ${reservation.seat_id} was released because reservation ${reservation.reservation_id} was marked as No-Show.`
                }, connection);
            }

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