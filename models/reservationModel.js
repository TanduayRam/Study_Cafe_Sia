const db = require('../config/databases');
const logAction = require('../utils/audit_logger');
const sessionLogs = require('./session_logs_model');
const { createError } = require('../utils/http');

const HOUR_MS = 3600000;

// One reservation with its member, seat and zone.
const SELECT_RESERVATION =
    'SELECT r.reservation_id, r.user_id, u.name AS member_name, ' +
    'r.seat_id, s.label AS seat_label, s.zone_id, z.name AS zone_name, ' +
    'z.type AS zone_type, z.hourly_rate, z.max_hours, ' +
    'r.start_time, r.end_time, r.status, r.checked_in_at, r.checked_out_at, r.created_at ' +
    'FROM reservations r ' +
    'INNER JOIN users u ON r.user_id = u.user_id ' +
    'INNER JOIN seats s ON r.seat_id = s.seat_id ' +
    'INNER JOIN study_zones z ON s.zone_id = z.zone_id';

// filters can have user_id and/or status.
async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_RESERVATION;
    const conditions = [];
    const values = [];

    if (filters.user_id) {
        conditions.push('r.user_id = ?');
        values.push(filters.user_id);
    }
    if (filters.status) {
        conditions.push('r.status = ?');
        values.push(filters.status);
    }
    if (conditions.length > 0) {
        sql = sql + ' WHERE ' + conditions.join(' AND ');
    }

    sql = sql + ' ORDER BY r.reservation_id DESC';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_RESERVATION + ' WHERE r.reservation_id = ?', [id]);
    return rows[0];
}

// The booking rules. It runs INSIDE a transaction.
// FOR UPDATE locks the seat row so two people cannot book the same seat at the same moment.
async function checkBookingRules(connection, seatId, start, end, ignoreReservationId) {
    const [seats] = await connection.query(
        `SELECT s.seat_id, s.status, z.max_hours
         FROM seats s INNER JOIN study_zones z ON s.zone_id = z.zone_id
         WHERE s.seat_id = ? FOR UPDATE`,
        [seatId]
    );

    if (seats.length === 0) {
        throw createError(404, 'Seat not found.');
    }

    const seat = seats[0];

    if (seat.status === 'Maintenance') {
        throw createError(400, 'This seat is under maintenance and cannot be booked.');
    }

    if (end <= start) {
        throw createError(400, 'End time must be later than start time.');
    }

    const hours = (end - start) / HOUR_MS;

    if (hours < 1) {
        throw createError(400, 'The minimum reservation is 1 hour.');
    }
    if (hours > seat.max_hours) {
        throw createError(400, 'The maximum reservation for this zone is ' + seat.max_hours + ' hours.');
    }

    // Two bookings overlap when one starts before the other ends AND ends after the other starts.
    const [clashes] = await connection.query(
        `SELECT reservation_id FROM reservations
         WHERE seat_id = ? AND status IN ('Confirmed', 'CheckedIn')
           AND reservation_id <> ?
           AND start_time < ? AND end_time > ?
         LIMIT 1`,
        [seatId, ignoreReservationId || 0, end, start]
    );

    if (clashes.length > 0) {
        throw createError(400, 'This seat is already reserved during that time. Please pick another time or seat.');
    }
}

// Creates a reservation. data = { user_id, seat_id, start, end }
async function create(data, actorId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await checkBookingRules(connection, data.seat_id, data.start, data.end, null);

        const [result] = await connection.query(
            "INSERT INTO reservations (user_id, seat_id, start_time, end_time, status) VALUES (?, ?, ?, ?, 'Confirmed')",
            [data.user_id, data.seat_id, data.start, data.end]
        );

        await logAction(actorId, 'CREATE', 'reservations', result.insertId,
            'Reservation created for seat ' + data.seat_id + '.', connection);

        await connection.commit();
        return getById(result.insertId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Changes the seat or the times. Only a Confirmed reservation can be changed.
async function update(id, data, actorId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT reservation_id, status FROM reservations WHERE reservation_id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }
        if (rows[0].status !== 'Confirmed') {
            throw createError(400, 'Only Confirmed reservations can be changed.');
        }

        await checkBookingRules(connection, data.seat_id, data.start, data.end, id);

        await connection.query(
            'UPDATE reservations SET seat_id = ?, start_time = ?, end_time = ? WHERE reservation_id = ?',
            [data.seat_id, data.start, data.end, id]
        );

        await logAction(actorId, 'UPDATE', 'reservations', id, 'Reservation rescheduled.', connection);

        await connection.commit();
        return getById(id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// CHECK-IN: the reservation becomes CheckedIn and the seat becomes Occupied.
// Both changes happen in ONE transaction: both are saved, or none of them.
async function checkIn(id, actorId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT r.reservation_id, r.user_id, r.seat_id, r.start_time, r.end_time, r.status,
                    s.zone_id, s.status AS seat_status
             FROM reservations r INNER JOIN seats s ON r.seat_id = s.seat_id
             WHERE r.reservation_id = ? FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }

        const r = rows[0];

        if (r.status !== 'Confirmed') {
            throw createError(400, 'Only Confirmed reservations can be checked in (this one is ' + r.status + ').');
        }
        if (r.seat_status !== 'Available') {
            throw createError(400, 'The seat is ' + r.seat_status + ' right now, so check-in is not possible.');
        }

        const now = new Date();

        await connection.query(
            "UPDATE reservations SET status = 'CheckedIn', checked_in_at = ? WHERE reservation_id = ?",
            [now, id]
        );
        await connection.query("UPDATE seats SET status = 'Occupied' WHERE seat_id = ?", [r.seat_id]);

        // Start a session log (used later by the overstay alert).
        await sessionLogs.startSession(connection, {
            reservation_id: id,
            user_id: r.user_id,
            zone_id: r.zone_id,
            seat_id: r.seat_id,
            start_time: now,
            expected_end_time: r.end_time
        });

        await logAction(actorId, 'CHECK_IN', 'reservations', id,
            'Reservation ' + id + ' checked in. Seat ' + r.seat_id + ' is now Occupied.', connection);

        await connection.commit();
        return getById(id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// CANCEL (this is what DELETE does). We keep the row and set status = Cancelled.
// Confirmed: the owner or staff can cancel. CheckedIn: only an Admin.
async function cancel(id, actor) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT reservation_id, user_id, seat_id, status FROM reservations WHERE reservation_id = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }

        const r = rows[0];

        if (actor.role === 'Member' && r.user_id !== actor.user_id) {
            throw createError(403, 'You can only cancel your own reservations.');
        }
        if (r.status === 'CheckedIn' && actor.role !== 'Admin') {
            throw createError(403, 'Only an Admin can cancel a reservation that is already checked in.');
        }
        if (r.status !== 'Confirmed' && r.status !== 'CheckedIn') {
            throw createError(400, 'A ' + r.status + ' reservation cannot be cancelled.');
        }

        await connection.query("UPDATE reservations SET status = 'Cancelled' WHERE reservation_id = ?", [id]);

        // If the member was already sitting, free the seat and close the session.
        if (r.status === 'CheckedIn') {
            await connection.query("UPDATE seats SET status = 'Available' WHERE seat_id = ?", [r.seat_id]);
            await sessionLogs.endSession(connection, id, new Date());
        }

        await logAction(actor.user_id, 'CANCEL', 'reservations', id, 'Reservation ' + id + ' cancelled.', connection);

        await connection.commit();
        return getById(id);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    checkIn: checkIn,
    cancel: cancel
};
