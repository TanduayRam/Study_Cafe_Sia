const zoneModel = require('../models/studyZoneModel');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

const ZONE_TYPES = ['Open Floor', 'Quiet Zone', 'Private Room', 'Game Station', 'Solitude Wall'];

// Checks the form data and returns clean values. Throws a 400 error if something is wrong.
function validateZone(body) {
    if (isBlank(body.name)) {
        throw createError(400, 'Zone name is required.');
    }
    if (ZONE_TYPES.includes(body.type) === false) {
        throw createError(400, 'Zone type must be one of: ' + ZONE_TYPES.join(', ') + '.');
    }

    const rate = Number(body.hourly_rate);
    if (isBlank(body.hourly_rate) || isNaN(rate) || rate <= 0) {
        throw createError(400, 'Hourly rate must be a number above 0.');
    }

    const hours = Number(body.max_hours);
    if (isBlank(body.max_hours) || !Number.isInteger(hours) || hours < 1 || hours > 8) {
        throw createError(400, 'Max hours must be a whole number from 1 to 8.');
    }

    const capacity = Number(body.capacity);
    if (isBlank(body.capacity) || !Number.isInteger(capacity) || capacity < 1) {
        throw createError(400, 'Capacity must be a whole number of at least 1.');
    }

    return {
        name: String(body.name).trim(),
        type: body.type,
        hourly_rate: rate,
        max_hours: hours,
        capacity: capacity
    };
}

// GET /study-zones
exports.getAll = async function (req, res, next) {
    try {
        const zones = await zoneModel.getAll();
        return sendSuccess(res, zones, 'Study zones retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /study-zones/:id
exports.getById = async function (req, res, next) {
    try {
        const zone = await zoneModel.getById(toId(req.params.id, 'Zone ID'));

        if (!zone) {
            throw createError(404, 'Study zone not found.');
        }

        return sendSuccess(res, zone, 'Study zone retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /study-zones
exports.create = async function (req, res, next) {
    try {
        const clean = validateZone(req.body || {});
        const zone = await zoneModel.create(clean);
        return sendSuccess(res, zone, 'Study zone created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /study-zones/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Zone ID');
        const clean = validateZone(req.body || {});
        const zone = await zoneModel.update(id, clean);

        if (!zone) {
            throw createError(404, 'Study zone not found.');
        }

        return sendSuccess(res, zone, 'Study zone updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /study-zones/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Zone ID');

        const zone = await zoneModel.getById(id);
        if (!zone) {
            throw createError(404, 'Study zone not found.');
        }

        const seatCount = await zoneModel.countSeats(id);
        if (seatCount > 0) {
            throw createError(400, 'This zone still has seats. Remove or move its seats first.');
        }

        await zoneModel.remove(id);
        return sendSuccess(res, { zone_id: id }, 'Study zone deleted.');
    } catch (error) {
        next(error);
    }
};
