const db = require('../config/databases');
const logAction = require('../utils/audit_log');

// Release seats for reservations that were not checked in
// within the 15-minute grace period.
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
        await connection.query(
            `UPDATE reservations
             SET status = 'No-Show'
             WHERE reservation_id = ?
               AND status = 'Confirmed'`,
            [reservation.reservation_id]
        );

        // Record the no-show action in the audit logs.
await logAction({
    userId: reservation.user_id,
    action: 'NO_SHOW_RELEASED',
    tableName: 'reservations',
    recordId: reservation.reservation_id,
    description: `Reservation ${reservation.reservation_id} marked as No-Show and seat ${reservation.seat_id} released.`
}, connection);

        // Release the reserved seat.
        await connection.query(
            `UPDATE seats
             SET status = 'Available'
             WHERE seat_id = ?`,
            [reservation.seat_id]
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
