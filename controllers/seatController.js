const seatModel = require('../models/seatModel');
const zoneModel = require('../models/studyZoneModel');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

const SEAT_STATUSES = ['Available', 'Occupied', 'Maintenance'];

// Used by POST, PUT and PATCH.
// "existing" is the old seat (only for update). A field that was not sent keeps its old value.
async function cleanSeat(body, existing) {
    let zoneId = body.zone_id;
    let label = body.label;
    let status = body.status;

    if (existing) {
        if (zoneId === undefined) zoneId = existing.zone_id;
        if (label === undefined) label = existing.label;
        if (status === undefined) status = existing.status;
    }
    if (status === undefined) status = 'Available';

    if (isBlank(label)) {
        throw createError(400, 'Seat label is required.');
    }
    if (SEAT_STATUSES.includes(status) === false) {
        throw createError(400, 'Seat status must be one of: ' + SEAT_STATUSES.join(', ') + '.');
    }

    zoneId = toId(zoneId, 'Zone ID');
    const zone = await zoneModel.getById(zoneId);
    if (!zone) {
        throw createError(400, 'The selected study zone does not exist.');
    }

    return { zone_id: zoneId, label: String(label).trim(), status: status };
}

// GET /seats   (optional ?zone_id=1&status=Available)
exports.getAll = async function (req, res, next) {
    try {
        const filters = {};

        if (req.query.zone_id) {
            filters.zone_id = toId(req.query.zone_id, 'Zone ID');
        }
        if (req.query.status) {
            if (SEAT_STATUSES.includes(req.query.status) === false) {
                throw createError(400, 'Seat status must be one of: ' + SEAT_STATUSES.join(', ') + '.');
            }
            filters.status = req.query.status;
        }

        const seats = await seatModel.getAll(filters);
        return sendSuccess(res, seats, 'Seats retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /seats/:id
exports.getById = async function (req, res, next) {
    try {
        const seat = await seatModel.getById(toId(req.params.id, 'Seat ID'));

        if (!seat) {
            throw createError(404, 'Seat not found.');
        }

        return sendSuccess(res, seat, 'Seat retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /seats
exports.create = async function (req, res, next) {
    try {
        const clean = await cleanSeat(req.body || {}, null);
        const seat = await seatModel.create(clean);
        return sendSuccess(res, seat, 'Seat created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /seats/:id and PATCH /seats/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Seat ID');

        const existing = await seatModel.getById(id);
        if (!existing) {
            throw createError(404, 'Seat not found.');
        }

        const clean = await cleanSeat(req.body || {}, existing);
        const seat = await seatModel.update(id, clean);
        return sendSuccess(res, seat, 'Seat updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /seats/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Seat ID');

        const seat = await seatModel.getById(id);
        if (!seat) {
            throw createError(404, 'Seat not found.');
        }

        const reservationCount = await seatModel.countReservations(id);
        if (reservationCount > 0) {
            throw createError(400, 'This seat has reservations, so it cannot be deleted. Set it to Maintenance instead.');
        }

        await seatModel.remove(id);
        return sendSuccess(res, { seat_id: id }, 'Seat deleted.');
    } catch (error) {
        next(error);
    }
};
