const db = require('../config/databases');
const billingModel = require('./billing_model');
const paymentModel = require('./payment_model');

// Process checkout in one database transaction.
async function checkoutReservation(
    reservationId,
    paymentMethod,
    checkoutTime = new Date()
) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the reservation to prevent duplicate checkout.
        const [reservations] = await connection.query(
            `SELECT reservation_id, seat_id, user_id, status
             FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [reservationId]
        );

        if (reservations.length === 0) {
            throw new Error('Reservation not found.');
        }

        const reservation = reservations[0];

        if (reservation.status !== 'CheckedIn') {
            throw new Error('Only checked-in reservations can be checked out.');
        }

        // Calculate the bill using the same transaction.
        const bill = await billingModel.computeBill(
            reservationId,
            checkoutTime,
            connection
        );

        // Deduct the member pass hours used.
        for (const deduction of bill.pass_deductions) {
            const [result] = await connection.query(
                `UPDATE member_passes
                 SET remaining_hours = remaining_hours - ?
                 WHERE member_pass_id = ?
                   AND remaining_hours >= ?`,
                [
                    deduction.hours_used,
                    deduction.member_pass_id,
                    deduction.hours_used
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Insufficient member pass hours.');
            }
        }

        // Create the payment within the same transaction.
        const payment = await paymentModel.create({
            reservation_id: reservationId,
            pass_amount: bill.pass_amount,
            cash_amount: bill.cash_amount,
            total_amount: bill.total_amount,
            payment_method: paymentMethod
        }, connection);

        // Mark the reservation as completed.
        await connection.query(
            `UPDATE reservations
             SET status = 'Completed'
             WHERE reservation_id = ?`,
            [reservationId]
        );

        // Release the seat.
        await connection.query(
            `UPDATE seats
             SET status = 'Available'
             WHERE seat_id = ?`,
            [reservation.seat_id]
        );

        await connection.commit();

        return {
            bill,
            payment
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    checkoutReservation
};