const reservationModel = require('../models/reservationModel');
const seatModel = require('../models/seatModel');
const studyZoneModel = require('../models/studyZoneModel');
const db = require('../config/databases');

// Check whether the logged-in user owns a reservation.
const isOwner = (reservation, user) => {
    return Number(reservation.user_id) === Number(user.id);
};

// Get all reservations
const getAll = async (req, res) => {
    try {
        const reservations = await reservationModel.getAll();

        return res.status(200).json(reservations);

    } catch (error) {
        console.error('Get reservations error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve reservations.'
        });
    }
};

// Get one reservation
const getById = async (req, res) => {
    try {
        const reservation = await reservationModel.getById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        // Customers can only access their own reservations.
        if (
            req.user.role === 'customer' &&
            !isOwner(reservation, req.user)
        ) {
            return res.status(403).json({
                message: 'You can only access your own reservations.'
            });
        }

        return res.status(200).json(reservation);

    } catch (error) {
        console.error('Get reservation error:', error);

        return res.status(500).json({
            message: 'Failed to retrieve reservation.'
        });
    }
};

// Create a reservation
const create = async (req, res) => {
    try {
        const {
            user_id,
            seat_id,
            start_time,
            end_time
        } = req.body;

        // Customers must use their authenticated account ID.
        const reservationUserId =
            req.user.role === 'customer' ? req.user.id : user_id;

        if (!reservationUserId || !seat_id || !start_time || !end_time) {
            return res.status(400).json({
                message: 'User, seat, start time, and end time are required.'
            });
        }
 
        const start = new Date(start_time);
        const end = new Date(end_time);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid reservation date or time.'
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: 'End time must be later than start time.'
            });
        }
 
        const duration = (end - start) / (1000 * 60 * 60);

        if (duration < 1) {
            return res.status(400).json({
                message: 'Minimum reservation duration is 1 hour.'
            });
        }

        // Check whether the user exists.
        const [users] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [reservationUserId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Check whether the seat exists.
        const seat = await seatModel.getById(seat_id);

        if (!seat) {
            return res.status(404).json({
                message: 'Seat not found.'
            });
        }

        if (seat.status !== 'Available') {
            return res.status(400).json({
                message: 'This seat is not available.'
            });
        }

        // Check the study zone.
        const zone = await studyZoneModel.getById(seat.study_zone_id);

        if (!zone) {
            return res.status(404).json({
                message: 'Study zone not found.'
            });
        }

         if (duration > zone.max_hours) {
            return res.status(400).json({
                message: `Maximum reservation duration for this zone is ${zone.max_hours} hours.`
            });
        }

        // Check for overlapping reservations.
        const [conflicts] = await db.query(
            `SELECT reservation_id
             FROM reservations
             WHERE seat_id = ?
             AND status IN ('Confirmed', 'CheckedIn')
             AND start_time < ?
             AND end_time > ?`,
            [seat_id, end_time, start_time]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({
                message: 'This seat already has a reservation during that time.'
            });
        }

         const reservation = await reservationModel.create({
            user_id: reservationUserId,
            seat_id,
            start_time,
            end_time
        });

        return res.status(201).json(reservation);

    } catch (error) {
        console.error('Create reservation error:', error);

        return res.status(500).json({
            message: 'Failed to create reservation.'
        });
    }
};
 
 // Update a reservation
 const update = async (req, res) => {
    try {
        const id = req.params.id;

         const existing = await reservationModel.getById(id);

        if (!existing) {
            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        // Customers can only update their own reservations.
        if (
            req.user.role === 'customer' &&
            !isOwner(existing, req.user)
        ) {
            return res.status(403).json({
                message: 'You can only update your own reservations.'
            });
        }

        if (existing.status !== 'Confirmed') {
            return res.status(400).json({
                message: 'Only confirmed reservations can be updated.'
            });
        }

        const { seat_id, start_time, end_time } = req.body;

         if (!seat_id || !start_time || !end_time) {
            return res.status(400).json({
                message: 'Seat, start time, and end time are required.'
            });
        }
 
        const start = new Date(start_time);
        const end = new Date(end_time);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid reservation date or time.'
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: 'End time must be later than start time.'
            });
        }

         const duration = (end - start) / (1000 * 60 * 60);

        if (duration < 1) {
            return res.status(400).json({
                message: 'Minimum reservation duration is 1 hour.'
            });
        }

        // Check whether the seat exists.
        const seat = await seatModel.getById(seat_id);

        if (!seat) {
            return res.status(404).json({
                message: 'Seat not found.'
            });
        }

        if (seat.status !== 'Available') {
            return res.status(400).json({
                message: 'This seat is not available.'
            });
        }

        // Check the study zone.
        const zone = await studyZoneModel.getById(seat.study_zone_id);

        if (!zone) {
            return res.status(404).json({
                message: 'Study zone not found.'
            });
        }
 
        if (duration > zone.max_hours) {
            return res.status(400).json({
                message: `Maximum reservation duration for this zone is ${zone.max_hours} hours.`
            });
        }

        // Check for overlapping reservations, excluding the current reservation.
        const [conflicts] = await db.query(
            `SELECT reservation_id
             FROM reservations
             WHERE seat_id = ?
             AND reservation_id != ?
             AND status IN ('Confirmed', 'CheckedIn')
             AND start_time < ?
             AND end_time > ?`,
            [seat_id, id, end_time, start_time]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({
                message: 'This seat already has a reservation during that time.'
            });
        }
 
        await reservationModel.update(id, {
            user_id: existing.user_id,
            seat_id,
            start_time,
            end_time,
            status: existing.status
        });

         const updated = await reservationModel.getById(id);

        return res.status(200).json(updated);

    } catch (error) {
        console.error('Update reservation error:', error);

        return res.status(500).json({
            message: 'Failed to update reservation.'
        });
    }
};

// Check in a reservation
const checkIn = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE',
            [req.params.id]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];

        if (reservation.status !== 'Confirmed') {
            await connection.rollback();

            return res.status(400).json({
                message: 'Only confirmed reservations can be checked in.'
            });
        }

        await connection.query(
            `UPDATE reservations
             SET status = 'CheckedIn'
             WHERE reservation_id = ?`,
            [req.params.id]
        );

        await connection.query(
            `UPDATE seats
             SET status = 'Occupied'
             WHERE seat_id = ?`,
            [reservation.seat_id]
        );

        await connection.commit();

        return res.status(200).json({
            message: 'Customer checked in successfully.',
            reservation_id: reservation.reservation_id,
            seat_id: reservation.seat_id,
            status: 'CheckedIn',
            seat_status: 'Occupied'
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Check-in rollback error:', rollbackError);
            }
        }

        console.error('Check-in error:', error);

        return res.status(500).json({
            message: 'Failed to check in reservation.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Check out a reservation
const checkOut = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE',
            [req.params.id]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];

        if (reservation.status !== 'CheckedIn') {
            await connection.rollback();

            return res.status(400).json({
                message: 'Only checked-in reservations can be checked out.'
            });
        }

        await connection.query(
            `UPDATE reservations
             SET status = 'Completed'
             WHERE reservation_id = ?`,
            [req.params.id]
        );

        await connection.query(
            `UPDATE seats
             SET status = 'Available'
             WHERE seat_id = ?`,
            [reservation.seat_id]
        );

        await connection.commit();

        return res.status(200).json({
            message: 'Customer checked out successfully.',
            reservation_id: reservation.reservation_id,
            seat_id: reservation.seat_id,
            status: 'Completed',
            seat_status: 'Available'
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Check-out rollback error:', rollbackError);
            }
        }

        console.error('Check-out error:', error);

        return res.status(500).json({
            message: 'Failed to check out reservation.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Cancel a reservation
const remove = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE',
            [req.params.id]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        const reservation = rows[0];
        const userRole = req.user.role;

        // Only administrators and customers can cancel reservations.
        if (!['admin', 'customer'].includes(userRole)) {
            await connection.rollback();

            return res.status(403).json({
                message: 'You do not have permission to cancel reservations.'
            });
        }

        // Customers can only cancel their own reservations.
        if (
            userRole === 'customer' &&
            !isOwner(reservation, req.user)
        ) {
            await connection.rollback();

            return res.status(403).json({
                message: 'You can only cancel your own reservations.'
            });
        }

        // Customers can only cancel confirmed reservations.
        if (
            userRole === 'customer' &&
            reservation.status !== 'Confirmed'
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: 'Customers can only cancel confirmed reservations.'
            });
        }

        // Administrators can cancel confirmed or checked-in reservations.
        if (
            userRole === 'admin' &&
            !['Confirmed', 'CheckedIn'].includes(reservation.status)
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: 'This reservation cannot be cancelled.'
            });
        }

        await connection.query(
            `UPDATE reservations
             SET status = 'Cancelled'
             WHERE reservation_id = ?`,
            [req.params.id]
        );

        // Release the seat if an administrator cancels a checked-in reservation.
        if (
            userRole === 'admin' &&
            reservation.status === 'CheckedIn'
        ) {
            await connection.query(
                `UPDATE seats
                 SET status = 'Available'
                 WHERE seat_id = ?`,
                [reservation.seat_id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: 'Reservation cancelled successfully.',
            reservation_id: reservation.reservation_id,
            status: 'Cancelled'
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Cancellation rollback error:', rollbackError);
            }
        }

        console.error('Reservation cancellation error:', error);

        return res.status(500).json({
            message: 'Failed to cancel reservation.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Export reservation controller functions
module.exports = {
    getAll,
    getById,
    create,
    update,
    checkIn,
    checkOut,
    remove
 };