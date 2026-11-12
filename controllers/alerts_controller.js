const db = require('../config/databases');
const alerts = require('../models/alerts_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

const TYPES = ['Overstay', 'Capacity', 'LowStock'];
const STATUSES = ['Open', 'Acknowledged', 'Resolved'];

// GET /alerts   (optional ?status=Open&type=Capacity)
exports.getAll = async function (req, res, next) {
    try {
        const status = req.query.status;
        const type = req.query.type;

        if (status && STATUSES.includes(status) === false) {
            throw createError(400, 'Status must be one of: ' + STATUSES.join(', ') + '.');
        }
        if (type && TYPES.includes(type) === false) {
            throw createError(400, 'Alert type must be one of: ' + TYPES.join(', ') + '.');
        }

        const list = await alerts.getAll({ status: status, type: type });
        return sendSuccess(res, list, 'Alerts retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /alerts/:id
exports.getById = async function (req, res, next) {
    try {
        const alert = await alerts.getById(toId(req.params.id, 'Alert ID'));

        if (!alert) {
            throw createError(404, 'Alert not found.');
        }

        return sendSuccess(res, alert, 'Alert retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /alerts
exports.create = async function (req, res, next) {
    // This one needs a transaction, so we get our own connection first.
    const connection = await db.getConnection();

    try {
        const body = req.body || {};

        if (TYPES.includes(body.alert_type) === false) {
            throw createError(400, 'Alert type must be one of: ' + TYPES.join(', ') + '.');
        }
        if (isBlank(body.message)) {
            throw createError(400, 'Alert message is required.');
        }
        if (String(body.message).length > 255) {
            throw createError(400, 'Alert message must be 255 characters or fewer.');
        }

        const data = {
            alert_type: body.alert_type,
            message: String(body.message).trim(),
            zone_id: null,
            seat_id: null,
            item_id: null
        };
        if (body.zone_id) data.zone_id = toId(body.zone_id, 'Zone ID');
        if (body.seat_id) data.seat_id = toId(body.seat_id, 'Seat ID');
        if (body.item_id) data.item_id = toId(body.item_id, 'Item ID');

        await connection.beginTransaction();
        const alertId = await alerts.createIfNew(connection, data, req.user.user_id);

        if (!alertId) {
            throw createError(400, 'An open alert of this type already exists for the same zone, seat or item.');
        }

        await connection.commit();

        const alert = await alerts.getById(alertId);
        return sendSuccess(res, alert, 'Alert created.', 201);
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// PUT /alerts/:id   (edit type and message)
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Alert ID');
        const body = req.body || {};

        if (TYPES.includes(body.alert_type) === false) {
            throw createError(400, 'Alert type must be one of: ' + TYPES.join(', ') + '.');
        }
        if (isBlank(body.message) || String(body.message).length > 255) {
            throw createError(400, 'Alert message is required (255 characters at most).');
        }

        const alert = await alerts.update(id, { message: String(body.message).trim(), alert_type: body.alert_type }, req.user.user_id);

        if (!alert) {
            throw createError(404, 'Alert not found.');
        }

        return sendSuccess(res, alert, 'Alert updated.');
    } catch (error) {
        next(error);
    }
};

// Shared by acknowledge, resolve and patch.
async function changeStatus(req, res, next, newStatus) {
    try {
        const id = toId(req.params.id, 'Alert ID');
        const result = await alerts.setStatus(id, newStatus, req.user.user_id);

        if (result.error === 'missing') {
            throw createError(404, 'Alert not found.');
        }
        if (result.error === 'same') {
            throw createError(400, 'This alert is already ' + result.oldStatus + '.');
        }
        if (result.error === 'closed') {
            throw createError(400, 'A resolved alert cannot be changed.');
        }

        return sendSuccess(res, result.alert, 'Alert ' + newStatus.toLowerCase() + '.');
    } catch (error) {
        next(error);
    }
}

// PATCH /alerts/:id/acknowledge
exports.acknowledge = function (req, res, next) {
    return changeStatus(req, res, next, 'Acknowledged');
};

// PATCH /alerts/:id/resolve
exports.resolve = function (req, res, next) {
    return changeStatus(req, res, next, 'Resolved');
};

// PATCH /alerts/:id   with { "status": "Acknowledged" or "Resolved" }
exports.patch = function (req, res, next) {
    const status = (req.body || {}).status;

    if (status !== 'Acknowledged' && status !== 'Resolved') {
        return next(createError(400, 'Status must be Acknowledged or Resolved.'));
    }

    return changeStatus(req, res, next, status);
};

// DELETE /alerts/:id   (only Resolved alerts can be deleted, so open problems are never lost)
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Alert ID');

        const alert = await alerts.getById(id);
        if (!alert) {
            throw createError(404, 'Alert not found.');
        }
        if (alert.status !== 'Resolved') {
            throw createError(400, 'Only resolved alerts can be deleted. Resolve it first.');
        }

        await alerts.remove(id);
        await logAction(req.user.user_id, 'DELETE_ALERT', 'alerts', id, 'Resolved alert deleted.');

        return sendSuccess(res, { alert_id: id }, 'Alert deleted.');
    } catch (error) {
        next(error);
    }
};