const snapshotModel = require('../models/report_snapshot_model');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

// GET /report-snapshots
exports.getAll = async function (req, res, next) {
    try {
        const snapshots = await snapshotModel.getAll();
        return sendSuccess(res, snapshots, 'Report snapshots retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /report-snapshots/:id
exports.getById = async function (req, res, next) {
    try {
        const snapshot = await snapshotModel.getById(toId(req.params.id, 'Snapshot ID'));

        if (!snapshot) {
            throw createError(404, 'Snapshot not found.');
        }

        return sendSuccess(res, snapshot, 'Report snapshot retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /report-snapshots   with { title, report_data }
exports.create = async function (req, res, next) {
    try {
        const body = req.body || {};

        if (isBlank(body.title) || String(body.title).length > 150) {
            throw createError(400, 'A title is required (150 characters at most).');
        }
        if (body.report_data === undefined || body.report_data === null) {
            throw createError(400, 'report_data is required.');
        }

        const snapshot = await snapshotModel.create(String(body.title).trim(), body.report_data, req.user.user_id);
        return sendSuccess(res, snapshot, 'Report snapshot saved.', 201);
    } catch (error) {
        next(error);
    }
};

// DELETE /report-snapshots/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Snapshot ID');
        const deleted = await snapshotModel.remove(id);

        if (!deleted) {
            throw createError(404, 'Snapshot not found.');
        }

        return sendSuccess(res, { snapshot_id: id }, 'Report snapshot deleted.');
    } catch (error) {
        next(error);
    }
};
