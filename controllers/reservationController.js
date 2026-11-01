const reservationModel = require('../models/reservationModel');
const seatModel = require('../models/seatModel');
const studyZoneModel = require('../models/studyZoneModel');
const db = require('../config/databases');
const billingModel = require('../models/billing_model');
const paymentModel = require('../models/payment_model');

// Get all reservations
const getAll = async (req, res) => {
    try {
        const reservations = await reservationModel.getAll();
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        res.status(200).json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        // Check required fields
        if (!user_id || !seat_id || !start_time || !end_time) {
            return res.status(400).json({
                message: 'User, seat, start time, and end time are required.'
            });
        }

        // Validate date values
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

        // Check minimum reservation duration
        const duration = (end - start) / (1000 * 60 * 60);

        if (duration < 1) {
            return res.status(400).json({
                message: 'Minimum reservation duration is 1 hour.'
            });
        }

        // Check whether the user exists
        const [users] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Check whether the seat exists
        const seat = await seatModel.getById(seat_id);

        if (!seat) {
            return res.status(404).json({
                message: 'Seat not found.'
            });
        }

        // Get the seat's study zone
        const zone = await studyZoneModel.getById(seat.study_zone_id);

        if (!zone) {
            return res.status(404).json({
                message: 'Study zone not found.'
            });
        }

        // Check maximum reservation duration
        if (duration > zone.max_hours) {
            return res.status(400).json({
                message: `Maximum reservation duration for this zone is ${zone.max_hours} hours.`
            });
        }

        // Check overlapping reservations
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

        // Create reservation
        const reservation = await reservationModel.create({
            user_id,
            seat_id,
            start_time,
            end_time
        });

        res.status(201).json(reservation);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a reservation
// Update a reservation
const update = async (req, res) => {
    try {
        const id = req.params.id;

        // Find existing reservation
        const existing = await reservationModel.getById(id);

        if (!existing) {
            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        // Only confirmed reservations can be updated
        if (existing.status !== 'Confirmed') {
            return res.status(400).json({
                message: 'Only confirmed reservations can be updated.'
            });
        }

        const { seat_id, start_time, end_time } = req.body;

        // Check required fields
        if (!seat_id || !start_time || !end_time) {
            return res.status(400).json({
                message: 'Seat, start time, and end time are required.'
            });
        }

        // Validate date values
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

        // Check minimum duration
        const duration = (end - start) / (1000 * 60 * 60);

        if (duration < 1) {
            return res.status(400).json({
                message: 'Minimum reservation duration is 1 hour.'
            });
        }

        // Check whether the seat exists
        const seat = await seatModel.getById(seat_id);

        if (!seat) {
            return res.status(404).json({
                message: 'Seat not found.'
            });
        }

        // Get the seat's study zone
        const zone = await studyZoneModel.getById(seat.study_zone_id);

        if (!zone) {
            return res.status(404).json({
                message: 'Study zone not found.'
            });
        }

        // Check maximum duration
        if (duration > zone.max_hours) {
            return res.status(400).json({
                message: `Maximum reservation duration for this zone is ${zone.max_hours} hours.`
            });
        }

        // Check overlapping reservations, excluding itself
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

        // Update reservation
        await reservationModel.update(id, {
            user_id: existing.user_id,
            seat_id,
            start_time,
            end_time,
            status: existing.status
        });

        // Retrieve updated reservation
        const updated = await reservationModel.getById(id);

        res.status(200).json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check in a reservation
const checkIn = async (req, res) => {
    const connection = await db.getConnection();

    try {
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

        res.status(200).json({
            message: 'Customer checked in successfully.',
            reservation_id: reservation.reservation_id,
            seat_id: reservation.seat_id,
            status: 'CheckedIn',
            seat_status: 'Occupied'
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// Check out a reservation
const checkOut = async (req, res) => {
    const connection = await db.getConnection();

    try {
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

        res.status(200).json({
            message: 'Customer checked out successfully.',
            reservation_id: reservation.reservation_id,
            seat_id: reservation.seat_id,
            status: 'Completed',
            seat_status: 'Available'
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// Cancel a reservation
const remove = async (req, res) => {
    const connection = await db.getConnection();

    try {
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

        if (reservation.status !== 'Confirmed' &&
            reservation.status !== 'CheckedIn') {
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

        if (reservation.status === 'CheckedIn') {
            await connection.query(
                `UPDATE seats
                 SET status = 'Available'
                 WHERE seat_id = ?`,
                [reservation.seat_id]
            );
        }

        await connection.commit();

        res.status(200).json({
            message: 'Reservation cancelled successfully.',
            reservation_id: reservation.reservation_id,
            status: 'Cancelled'
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};
module.exports = {
    getAll,
    getById,
    create,
    update,
    checkIn,
    checkOut,
    remove
};
