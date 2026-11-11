const sessionLogs = require('../models/session_logs_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, toId, toDate } = require('../utils/http');

const STATUSES = ['Active', 'Completed', 'NoShow'];

// GET /session-logs   (optional ?status=Active)
exports.getAll = async function (req, res, next) {
    try {
        const status = req.query.status;

        if (status && STATUSES.includes(status) === false) {
            throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
        }

        const logs = await sessionLogs.getAll({ status: status });
        return sendSuccess(res, logs, 'Session logs retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /session-logs/:id
exports.getById = async function (req, res, next) {
    try {
        const log = await sessionLogs.getById(toId(req.params.id, 'Session log ID'));

        if (!log) {
            throw createError(404, 'Session log not found.');
        }

        return sendSuccess(res, log, 'Session log retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /session-logs
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};
        let status = body.status;
        if (!status) status = 'Active';

        if (STATUSES.includes(status) === false) {
            throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
        }

        // Optional fields become null when they are empty.
        let reservationId = null;
        if (body.reservation_id) reservationId = toId(body.reservation_id, 'Reservation ID');

        let seatId = null;
        if (body.seat_id) seatId = toId(body.seat_id, 'Seat ID');

        let expectedEnd = null;
        if (body.expected_end_time) expectedEnd = toDate(body.expected_end_time, 'Expected end time');

        let endTime = null;
        if (body.end_time) endTime = toDate(body.end_time, 'End time');

        const log = await sessionLogs.create({
            reservation_id: reservationId,
            user_id: toId(body.user_id, 'User ID'),
            zone_id: toId(body.zone_id, 'Zone ID'),
            seat_id: seatId,
            start_time: toDate(body.start_time, 'Start time'),
            expected_end_time: expectedEnd,
            end_time: endTime,
            status: status
        });

        await logAction(req.user.user_id, 'CREATE', 'session_logs', log.session_log_id, 'Session log added manually.');

        return sendSuccess(res, log, 'Session log created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /session-logs/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Session log ID');
        const body = req.body || {};

        if (STATUSES.includes(body.status) === false) {
            throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
        }

        let endTime = null;
        if (body.end_time) endTime = toDate(body.end_time, 'End time');

        const log = await sessionLogs.update(id, { end_time: endTime, status: body.status });

        if (!log) {
            throw createError(404, 'Session log not found.');
        }

        await logAction(req.user.user_id, 'UPDATE', 'session_logs', id, 'Session log set to ' + body.status + '.');

        return sendSuccess(res, log, 'Session log updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /session-logs/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Session log ID');
        const deleted = await sessionLogs.remove(id);

        if (!deleted) {
            throw createError(404, 'Session log not found.');
        }

        await logAction(req.user.user_id, 'DELETE', 'session_logs', id, 'Session log deleted.');

        return sendSuccess(res, { session_log_id: id }, 'Session log deleted.');
    } catch (error) {
        next(error);
    }
};