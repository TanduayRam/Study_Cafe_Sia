const reservationModel = require('../models/reservationModel');
<<<<<<< Updated upstream
const checkoutModel = require('../models/checkout_model');
const User = require('../models/user_model');
const { createError, sendSuccess, toId, toDate, isBlank } = require('../utils/http');

const STATUSES = ['Confirmed', 'CheckedIn', 'Completed', 'Cancelled', 'NoShow'];
const PAYMENT_METHODS = ['Cash', 'GCash', 'Card'];

// Admin and Staff are "staff". A Member is not.
function isStaff(user) {
    return user.role === 'Admin' || user.role === 'Staff';
}

// A Member may only touch their own reservations.
function checkOwnerOrStaff(reservation, user) {
    if (isStaff(user) === false && reservation.user_id !== user.user_id) {
        throw createError(403, 'You can only access your own reservations.');
    }
}

// Reads the id from the address and finds the reservation. Throws 404 if it does not exist.
async function loadReservation(req) {
    const reservation = await reservationModel.getById(toId(req.params.id, 'Reservation ID'));

    if (!reservation) {
        throw createError(404, 'Reservation not found.');
    }
    return reservation;
}

// GET /reservations   (optional ?status=Confirmed)
exports.getAll = async function (req, res, next) {
    try {
        const filters = {};

        if (req.query.status) {
            if (STATUSES.includes(req.query.status) === false) {
                throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
            }
            filters.status = req.query.status;
        }

        // A Member always sees only their own bookings.
        if (isStaff(req.user) === false) {
            filters.user_id = req.user.user_id;
        } else if (req.query.user_id) {
            filters.user_id = toId(req.query.user_id, 'User ID');
        }

        const list = await reservationModel.getAll(filters);
        return sendSuccess(res, list, 'Reservations retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /reservations/:id
exports.getById = async function (req, res, next) {
    try {
        const reservation = await loadReservation(req);
        checkOwnerOrStaff(reservation, req.user);
        return sendSuccess(res, reservation, 'Reservation retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /reservations   with { user_id (staff only), seat_id, start_time, end_time }
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};

        // A Member books for themselves. Staff choose the member.
        let userId = req.user.user_id;
        if (isStaff(req.user)) {
            userId = toId(body.user_id, 'Member');
        }

        const seatId = toId(body.seat_id, 'Seat');
        const start = toDate(body.start_time, 'Start time');
        const end = toDate(body.end_time, 'End time');

        const member = await User.getById(userId);
        if (!member) {
            throw createError(404, 'Member not found.');
        }
        if (!member.is_active) {
            throw createError(400, 'This member account is deactivated.');
        }

        const reservation = await reservationModel.create(
            { user_id: userId, seat_id: seatId, start: start, end: end },
            req.user.user_id
        );

        return sendSuccess(res, reservation, 'Reservation created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /reservations/:id
exports.update = async function (req, res, next) {
    try {
        const existing = await loadReservation(req);
        checkOwnerOrStaff(existing, req.user);

        const body = req.body || {};

        // Anything that was not sent keeps its old value.
        let seatId = existing.seat_id;
        if (body.seat_id !== undefined) seatId = toId(body.seat_id, 'Seat');

        let startValue = existing.start_time;
        if (body.start_time !== undefined) startValue = body.start_time;

        let endValue = existing.end_time;
        if (body.end_time !== undefined) endValue = body.end_time;

        const reservation = await reservationModel.update(
            existing.reservation_id,
            { seat_id: seatId, start: toDate(startValue, 'Start time'), end: toDate(endValue, 'End time') },
            req.user.user_id
        );

        return sendSuccess(res, reservation, 'Reservation updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /reservations/:id   = cancel. The row is kept with status Cancelled.
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const reservation = await reservationModel.cancel(id, req.user);
        return sendSuccess(res, reservation, 'Reservation cancelled.');
    } catch (error) {
        next(error);
    }
};

// POST /reservations/:id/check-in
exports.checkIn = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const reservation = await reservationModel.checkIn(id, req.user.user_id);
        return sendSuccess(res, reservation, 'Checked in. The seat is now Occupied.');
    } catch (error) {
        next(error);
    }
};

// POST /reservations/:id/check-out   with { payment_method, checkout_time (demo only) }
exports.checkOut = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const body = req.body || {};

        let method = 'Cash';
        if (isBlank(body.payment_method) === false) {
            method = String(body.payment_method).trim();
        }
        if (PAYMENT_METHODS.includes(method) === false) {
            throw createError(400, 'Payment method must be one of: ' + PAYMENT_METHODS.join(', ') + '.');
        }

        let at = new Date();
        if (body.checkout_time) {
            at = toDate(body.checkout_time, 'Checkout time');
        }

        const result = await checkoutModel.checkout(id, method, at, req.user.user_id);
        return sendSuccess(res, result, 'Check-out complete. Payment saved and the seat is Available.');
    } catch (error) {
        next(error);
    }
};
=======
const seatModel = require('../models/seatModel');
const zoneModel = require('../models/studyZoneModel');
const db = require('../config/databases');
const sessionLogsModel = require('../models/session_logs_model');
const { sendSuccess, createError, toId, toDate, isBlank } = require('../utils/http');

function requireOwner(reservation, user) {
    if (Number(reservation.user_id) !== Number(user.user_id)) {
        throw createError(403, 'You can only access your own reservations.');
    }
}

exports.getAll = async function (req, res, next) {
    try {
        const userId = req.user.role === 'Member' ? req.user.user_id : null;
        const rows = await reservationModel.getAll(userId);
        return sendSuccess(res, rows, 'Reservations retrieved.');
    } catch (error) { next(error); }
};

exports.getById = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const reservation = await reservationModel.getById(id);
        if (!reservation) throw createError(404, 'Reservation not found.');
        if (req.user.role === 'Member') requireOwner(reservation, req.user);
        return sendSuccess(res, reservation, 'Reservation retrieved.');
    } catch (error) { next(error); }
};

exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        const userId = req.user.role === 'Member' ? req.user.user_id : toId(body.user_id, 'User ID');
        const seatId = toId(body.seat_id, 'Seat ID');
        const start = toDate(body.start_time, 'Start time');
        const end = toDate(body.end_time, 'End time');
        if (end <= start) throw createError(400, 'End time must be later than start time.');
        const duration = (end - start) / 3600000;
        if (duration < 1) throw createError(400, 'Minimum reservation duration is 1 hour.');

        const [users] = await db.query('SELECT user_id FROM users WHERE user_id = ? AND is_active = 1', [userId]);
        if (!users.length) throw createError(404, 'Active user not found.');
        const seat = await seatModel.getById(seatId);
        if (!seat) throw createError(404, 'Seat not found.');
        if (seat.status !== 'Available') throw createError(400, 'This seat is not available.');
        const zone = await zoneModel.getById(seat.zone_id);
        if (!zone) throw createError(404, 'Study zone not found.');
        if (duration > zone.max_hours) throw createError(400, `Maximum reservation duration for this zone is ${zone.max_hours} hours.`);

        const [conflicts] = await db.query(
            `SELECT reservation_id FROM reservations
             WHERE seat_id = ? AND status IN ('Confirmed','CheckedIn')
             AND start_time < ? AND end_time > ?`,
            [seatId, end.toISOString().slice(0, 19).replace('T', ' '), start.toISOString().slice(0, 19).replace('T', ' ')]
        );
        if (conflicts.length) throw createError(400, 'This seat already has a reservation during that time.');

        const reservation = await reservationModel.create({
            user_id: userId, seat_id: seatId,
            start_time: start.toISOString().slice(0, 19).replace('T', ' '),
            end_time: end.toISOString().slice(0, 19).replace('T', ' ')
        });
        return sendSuccess(res, reservation, 'Reservation created.', 201);
    } catch (error) { next(error); }
};

exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const existing = await reservationModel.getById(id);
        if (!existing) throw createError(404, 'Reservation not found.');
        if (req.user.role === 'Member') requireOwner(existing, req.user);
        if (existing.status !== 'Confirmed') throw createError(400, 'Only confirmed reservations can be updated.');

        const seatId = toId(req.body.seat_id, 'Seat ID');
        const start = toDate(req.body.start_time, 'Start time');
        const end = toDate(req.body.end_time, 'End time');
        if (end <= start) throw createError(400, 'End time must be later than start time.');
        const duration = (end - start) / 3600000;
        if (duration < 1) throw createError(400, 'Minimum reservation duration is 1 hour.');
        const seat = await seatModel.getById(seatId);
        if (!seat || seat.status !== 'Available') throw createError(400, 'The selected seat is not available.');
        const zone = await zoneModel.getById(seat.zone_id);
        if (!zone || duration > zone.max_hours) throw createError(400, 'Reservation duration exceeds the selected zone limit.');
        const [conflicts] = await db.query(
            `SELECT reservation_id FROM reservations WHERE seat_id = ? AND reservation_id <> ?
             AND status IN ('Confirmed','CheckedIn') AND start_time < ? AND end_time > ?`,
            [seatId, id, end.toISOString().slice(0, 19).replace('T', ' '), start.toISOString().slice(0, 19).replace('T', ' ')]
        );
        if (conflicts.length) throw createError(400, 'This seat already has a reservation during that time.');
        await reservationModel.update(id, {
            user_id: existing.user_id, seat_id: seatId,
            start_time: start.toISOString().slice(0, 19).replace('T', ' '),
            end_time: end.toISOString().slice(0, 19).replace('T', ' '), status: existing.status
        });
        return sendSuccess(res, await reservationModel.getById(id), 'Reservation updated.');
    } catch (error) { next(error); }
};

exports.checkIn = async function (req, res, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE', [toId(req.params.id, 'Reservation ID')]);
        if (!rows.length) throw createError(404, 'Reservation not found.');
        const reservation = rows[0];
        if (reservation.status !== 'Confirmed') throw createError(400, 'Only confirmed reservations can be checked in.');
        const [seatRows] = await connection.query('SELECT zone_id FROM seats WHERE seat_id = ?', [reservation.seat_id]);
        if (!seatRows.length) throw createError(404, 'Reservation seat not found.');
        await connection.query("UPDATE reservations SET status = 'CheckedIn', checked_in_at = UTC_TIMESTAMP() WHERE reservation_id = ?", [reservation.reservation_id]);
        await connection.query("UPDATE seats SET status = 'Occupied' WHERE seat_id = ?", [reservation.seat_id]);
        await sessionLogsModel.startSession(connection, {
            reservation_id: reservation.reservation_id,
            user_id: reservation.user_id,
            zone_id: seatRows[0].zone_id,
            seat_id: reservation.seat_id,
            start_time: reservation.start_time,
            expected_end_time: reservation.end_time
        });
        await connection.commit();
        return sendSuccess(res, { reservation_id: reservation.reservation_id, status: 'CheckedIn' }, 'Reservation checked in.');
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally { connection.release(); }
};

exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const reservation = await reservationModel.getById(id);
        if (!reservation) throw createError(404, 'Reservation not found.');
        if (req.user.role === 'Member') requireOwner(reservation, req.user);
        if (reservation.status !== 'Confirmed') throw createError(400, 'Only confirmed reservations can be cancelled.');
        await db.query("UPDATE reservations SET status = 'Cancelled' WHERE reservation_id = ?", [id]);
        return sendSuccess(res, { reservation_id: id }, 'Reservation cancelled.');
    } catch (error) { next(error); }
};
>>>>>>> Stashed changes
