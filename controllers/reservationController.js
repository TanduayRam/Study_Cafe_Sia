const reservationModel = require('../models/reservationModel');
const seatModel = require('../models/seatModel');
const studyZoneModel = require('../models/studyZoneModel');
const sessionLogsModel = require('../models/session_logs_model');
const memberPassModel = require('../models/member_pass_model');
const paymentModel = require('../models/payment_model');

const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

const {
    createError,
    sendSuccess,
    toId,
    toDate,
    roundMoney
} = require('../utils/http');

// Check reservation ownership.
function isOwner(reservation, user) {
    return Number(reservation.user_id) === Number(user.user_id);
}

// Only Admin, Staff, and the owning Member may access a reservation.
function canAccess(reservation, user) {
    if (user.role === 'Admin' || user.role === 'Staff') {
        return true;
    }

    if (user.role === 'Member' && isOwner(reservation, user)) {
        return true;
    }

    return false;
}

// Validate reservation date and duration.
function validateTimes(startTime, endTime, maxHours) {
    const start = toDate(startTime, 'Start time');
    const end = toDate(endTime, 'End time');

    if (end <= start) {
        throw createError(400, 'End time must be later than start time.');
    }

    const duration = (end - start) / (1000 * 60 * 60);

    if (duration < 1) {
        throw createError(400, 'Minimum reservation duration is 1 hour.');
    }

    if (maxHours && duration > Number(maxHours)) {
        throw createError(
            400,
            'Maximum reservation duration for this zone is ' +
            maxHours +
            ' hours.'
        );
    }

    return { start, end };
}

// Calculate billable hours.
// Minimum: 1 hour.
// Additional time: rounded up to the next 30 minutes.
function calculateBillableHours(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const elapsedHours = (end.getTime() - start.getTime()) /
        (1000 * 60 * 60);

    if (!Number.isFinite(elapsedHours) || elapsedHours <= 0) {
        throw createError(400, 'Invalid session duration.');
    }

    return Math.max(1, Math.ceil(elapsedHours * 2) / 2);
}

// Validate the seat and its study zone.
async function validateSeat(seatId, startTime, endTime, reservationId) {
    const seat = await seatModel.getById(seatId);

    if (!seat) {
        throw createError(404, 'Seat not found.');
    }

    if (seat.status === 'Maintenance') {
        throw createError(400, 'This seat is under maintenance.');
    }

    const zone = await studyZoneModel.getById(seat.zone_id);

    if (!zone) {
        throw createError(404, 'Study zone not found.');
    }

    const times = validateTimes(startTime, endTime, zone.max_hours);

    let sql = `
        SELECT reservation_id
        FROM reservations
        WHERE seat_id = ?
          AND status IN ('Confirmed', 'CheckedIn')
          AND start_time < ?
          AND end_time > ?
    `;

    const values = [seatId, times.end, times.start];

    if (reservationId) {
        sql += ' AND reservation_id != ?';
        values.push(reservationId);
    }

    const [conflicts] = await db.query(sql, values);

    if (conflicts.length > 0) {
        throw createError(
            400,
            'This seat already has a reservation during that time.'
        );
    }

    return { seat, zone, times };
}

// GET /reservations
exports.getAll = async function (req, res, next) {
    try {
        const reservations = await reservationModel.getAll();

        let result = reservations;

        // Members can only see their own reservations.
        if (req.user.role === 'Member') {
            result = result.filter(function (reservation) {
                return isOwner(reservation, req.user);
            });
        }

        // Optional status filtering.
        // Example: /reservations?status=Completed
        if (req.query.status) {
            result = result.filter(function (reservation) {
                return reservation.status === req.query.status;
            });
        }

        return sendSuccess(
            res,
            result,
            'Reservations retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /reservations/:id
exports.getById = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');

        const reservation = await reservationModel.getById(id);

        if (!reservation) {
            throw createError(404, 'Reservation not found.');
        }

        if (!canAccess(reservation, req.user)) {
            throw createError(
                403,
                'You can only access your own reservations.'
            );
        }

        return sendSuccess(
            res,
            reservation,
            'Reservation retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// POST /reservations
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};

        let reservationUserId;

        if (req.user.role === 'Member') {
            reservationUserId = req.user.user_id;
        } else if (
            req.user.role === 'Admin' ||
            req.user.role === 'Staff'
        ) {
            reservationUserId = toId(body.user_id, 'Member ID');
        } else {
            throw createError(403, 'You cannot create reservations.');
        }

        const [users] = await db.query(
            `SELECT u.user_id
             FROM users u
             INNER JOIN roles r ON u.role_id = r.role_id
             WHERE u.user_id = ?
               AND r.name = 'Member'
               AND u.is_active = 1`,
            [reservationUserId]
        );

        if (users.length === 0) {
            throw createError(404, 'Active Member account not found.');
        }

        const seatId = toId(body.seat_id, 'Seat ID');

        const validation = await validateSeat(
            seatId,
            body.start_time,
            body.end_time
        );

        const reservation = await reservationModel.create({
            user_id: reservationUserId,
            seat_id: seatId,
            start_time: validation.times.start,
            end_time: validation.times.end
        });

        await logAction(
            req.user.user_id,
            'CREATE_RESERVATION',
            'reservations',
            reservation.reservation_id,
            'Reservation created.'
        );

        return sendSuccess(
            res,
            reservation,
            'Reservation created successfully.',
            201
        );
    } catch (error) {
        next(error);
    }
};

// PUT /reservations/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Reservation ID');
        const body = req.body || {};

        const existing = await reservationModel.getById(id);

        if (!existing) {
            throw createError(404, 'Reservation not found.');
        }

        if (!canAccess(existing, req.user)) {
            throw createError(
                403,
                'You can only update your own reservations.'
            );
        }

        if (existing.status !== 'Confirmed') {
            throw createError(
                400,
                'Only confirmed reservations can be updated.'
            );
        }

        const seatId = toId(body.seat_id, 'Seat ID');

        const validation = await validateSeat(
            seatId,
            body.start_time,
            body.end_time,
            id
        );

        await reservationModel.update(id, {
            seat_id: seatId,
            start_time: validation.times.start,
            end_time: validation.times.end,
            status: existing.status
        });

        const updated = await reservationModel.getById(id);

        await logAction(
            req.user.user_id,
            'UPDATE_RESERVATION',
            'reservations',
            id,
            'Reservation details updated.'
        );

        return sendSuccess(
            res,
            updated,
            'Reservation updated successfully.'
        );
    } catch (error) {
        next(error);
    }
};

// POST /reservations/:id/check-in
exports.checkIn = async function (req, res, next) {
    let connection;

    try {
        const id = toId(req.params.id, 'Reservation ID');

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT *
             FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }

        const reservation = rows[0];

        if (reservation.status !== 'Confirmed') {
            throw createError(
                400,
                'Only confirmed reservations can be checked in.'
            );
        }

        const [activeSessions] = await connection.query(
            `SELECT session_log_id
             FROM session_logs
             WHERE seat_id = ?
               AND status = 'Active'
             LIMIT 1
             FOR UPDATE`,
            [reservation.seat_id]
        );

        if (activeSessions.length > 0) {
            throw createError(
                400,
                'This seat already has an active session.'
            );
        }

        const [seatRows] = await connection.query(
            'SELECT status FROM seats WHERE seat_id = ? FOR UPDATE',
            [reservation.seat_id]
        );

        if (seatRows.length === 0) {
            throw createError(404, 'Seat not found.');
        }

        if (seatRows[0].status === 'Maintenance') {
            throw createError(400, 'This seat is under maintenance.');
        }

        const [zoneRows] = await connection.query(
            'SELECT zone_id FROM seats WHERE seat_id = ?',
            [reservation.seat_id]
        );

        if (zoneRows.length === 0) {
            throw createError(404, 'Study zone not found.');
        }

        const zoneId = zoneRows[0].zone_id;
        const now = new Date();

        await sessionLogsModel.startSession(connection, {
            reservation_id: reservation.reservation_id,
            user_id: reservation.user_id,
            zone_id: zoneId,
            seat_id: reservation.seat_id,
            start_time: now,
            expected_end_time: reservation.end_time
        });

        await connection.query(
            `UPDATE reservations
             SET status = 'CheckedIn',
                 checked_in_at = ?
             WHERE reservation_id = ?`,
            [now, id]
        );

        await connection.query(
            `UPDATE seats
             SET status = 'Occupied'
             WHERE seat_id = ?`,
            [reservation.seat_id]
        );

        await logAction(
            req.user.user_id,
            'CHECK_IN',
            'reservations',
            id,
            'Reservation checked in and session started.',
            connection
        );

        await connection.commit();

        return sendSuccess(
            res,
            {
                reservation_id: id,
                seat_id: reservation.seat_id,
                status: 'CheckedIn',
                seat_status: 'Occupied'
            },
            'Member checked in successfully.'
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Check-in rollback error:', rollbackError);
            }
        }

        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// POST /reservations/:id/check-out
exports.checkOut = async function (req, res, next) {
    let connection;

    try {
        const id = toId(req.params.id, 'Reservation ID');

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT *
             FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }

        const reservation = rows[0];

        if (reservation.status !== 'CheckedIn') {
            throw createError(
                400,
                'Only checked-in reservations can be checked out.'
            );
        }

        const [sessionRows] = await connection.query(
            `SELECT session_log_id, start_time
             FROM session_logs
             WHERE reservation_id = ?
               AND status = 'Active'
             FOR UPDATE`,
            [id]
        );

        if (sessionRows.length !== 1) {
            throw createError(
                400,
                'An active session log could not be found for this reservation.'
            );
        }

        const session = sessionRows[0];
        const now = new Date();

        const billableHours = calculateBillableHours(
            session.start_time,
            now
        );

        const [zoneRows] = await connection.query(
            `SELECT
                sz.zone_id,
                sz.name AS zone_name,
                sz.type AS zone_type,
                sz.hourly_rate
             FROM seats s
             INNER JOIN study_zones sz
                 ON s.zone_id = sz.zone_id
             WHERE s.seat_id = ?
             FOR UPDATE`,
            [reservation.seat_id]
        );

        if (zoneRows.length === 0) {
            throw createError(404, 'Study zone not found.');
        }

        const zone = zoneRows[0];
        const hourlyRate = Number(zone.hourly_rate);

        if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
            throw createError(400, 'Invalid study zone hourly rate.');
        }

        const totalAmount = roundMoney(billableHours * hourlyRate);

        const isGameStation = zone.zone_type === 'Game Station';

        let passHoursUsed = 0;
        let passAmount = 0;
        let cashAmount = totalAmount;

        const passDeductions = [];

        if (!isGameStation && totalAmount > 0) {
            const passes = await memberPassModel.getUsableForUpdate(
                connection,
                reservation.user_id
            );

            let remainingHoursToCover = billableHours;

            for (let i = 0; i < passes.length; i++) {
                if (remainingHoursToCover <= 0) {
                    break;
                }

                const availableHours = Number(passes[i].remaining_hours);

                if (!Number.isFinite(availableHours) || availableHours <= 0) {
                    continue;
                }

                const hoursToUse = Math.min(
                    availableHours,
                    remainingHoursToCover
                );

                const roundedHours = Math.round(hoursToUse * 100) / 100;

                if (roundedHours <= 0) {
                    continue;
                }

                const deducted = await memberPassModel.deductHours(
                    connection,
                    passes[i].member_pass_id,
                    roundedHours
                );

                if (!deducted) {
                    throw createError(
                        409,
                        'A member pass could not be updated. Please try checkout again.'
                    );
                }

                passHoursUsed = Math.round(
                    (passHoursUsed + roundedHours) * 100
                ) / 100;

                remainingHoursToCover = Math.max(
                    0,
                    Math.round(
                        (remainingHoursToCover - roundedHours) * 100
                    ) / 100
                );

                passDeductions.push({
                    member_pass_id: passes[i].member_pass_id,
                    hours_used: roundedHours
                });
            }

            passAmount = roundMoney(passHoursUsed * hourlyRate);
            cashAmount = roundMoney(totalAmount - passAmount);

            if (cashAmount < 0) {
                throw createError(
                    500,
                    'The calculated payment amount is invalid.'
                );
            }
        }

        let paymentMethod = 'Cash';

        if (passHoursUsed > 0 && cashAmount > 0) {
            paymentMethod = 'Member Pass + Cash';
        } else if (passHoursUsed > 0) {
            paymentMethod = 'Member Pass';
        }

        if (isGameStation) {
            paymentMethod = 'Cash';
            passHoursUsed = 0;
            passAmount = 0;
            cashAmount = totalAmount;
        }

        // Create payment and record each individual pass deduction.
        const payment = await paymentModel.create(connection, {
            reservation_id: id,
            pass_hours_used: passHoursUsed,
            pass_amount: passAmount,
            cash_amount: cashAmount,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            pass_deductions: passDeductions
        });

        if (!payment) {
            throw createError(500, 'Payment could not be created.');
        }

        const closedSessions = await sessionLogsModel.endSession(
            connection,
            id,
            now
        );

        if (closedSessions !== 1) {
            throw createError(
                400,
                'The active session could not be completed.'
            );
        }

        await connection.query(
            `UPDATE reservations
             SET status = 'Completed',
                 checked_out_at = ?
             WHERE reservation_id = ?`,
            [now, id]
        );

        await connection.query(
            `UPDATE seats
             SET status = 'Available'
             WHERE seat_id = ?`,
            [reservation.seat_id]
        );

        await logAction(
            req.user.user_id,
            'CHECK_OUT',
            'reservations',
            id,
            'Reservation checked out. Billable hours: ' +
                billableHours +
                '. Total: ' +
                totalAmount +
                '. Pass amount: ' +
                passAmount +
                '. Cash amount: ' +
                cashAmount +
                '.',
            connection
        );

        await connection.commit();

        return sendSuccess(
            res,
            {
                reservation_id: id,
                seat_id: reservation.seat_id,
                status: 'Completed',
                seat_status: 'Available',
                zone_name: zone.zone_name,
                zone_type: zone.zone_type,
                hourly_rate: hourlyRate,
                session_start: session.start_time,
                checked_out_at: now,
                billable_hours: billableHours,
                pass_hours_used: passHoursUsed,
                pass_deductions: passDeductions,
                pass_amount: passAmount,
                cash_amount: cashAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment: payment
            },
            'Member checked out and payment recorded successfully.'
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Check-out rollback error:', rollbackError);
            }
        }

        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DELETE /reservations/:id
exports.remove = async function (req, res, next) {
    let connection;

    try {
        const id = toId(req.params.id, 'Reservation ID');

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT *
             FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            throw createError(404, 'Reservation not found.');
        }

        const reservation = rows[0];
        const role = req.user.role;

        if (!canAccess(reservation, req.user)) {
            throw createError(
                403,
                'You can only cancel your own reservations.'
            );
        }

        if (reservation.status === 'Confirmed') {
            // Confirmed reservations can be cancelled by their owner or staff.
        } else if (
            reservation.status === 'CheckedIn' &&
            (role === 'Admin' || role === 'Staff')
        ) {
            await sessionLogsModel.endSession(
                connection,
                id,
                new Date()
            );

            await connection.query(
                `UPDATE seats
                 SET status = 'Available'
                 WHERE seat_id = ?`,
                [reservation.seat_id]
            );
        } else {
            throw createError(
                400,
                'This reservation cannot be cancelled.'
            );
        }

        await connection.query(
            `UPDATE reservations
             SET status = 'Cancelled'
             WHERE reservation_id = ?`,
            [id]
        );

        await logAction(
            req.user.user_id,
            'CANCEL_RESERVATION',
            'reservations',
            id,
            'Reservation cancelled.',
            connection
        );

        await connection.commit();

        return sendSuccess(
            res,
            {
                reservation_id: id,
                status: 'Cancelled'
            },
            'Reservation cancelled successfully.'
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Cancellation rollback error:', rollbackError);
            }
        }

        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};