const auditLogs = require('../models/audit_logs_model');
const { createError, sendSuccess, toId } = require('../utils/http');

// The audit log is READ-ONLY: there is no create, update or delete here.

// GET /audit-logs   (optional ?table_name=payments&action=PAYMENT&limit=50)
exports.getAll = async function (req, res, next) {
    try {
        let limit = 200;

        if (req.query.limit !== undefined) {
            limit = Number(req.query.limit);
            if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
                throw createError(400, 'Limit must be a whole number from 1 to 1000.');
            }
        }

        const rows = await auditLogs.getAll({
            table_name: req.query.table_name,
            action: req.query.action,
            limit: limit
        });
        return sendSuccess(res, rows, 'Audit logs retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /audit-logs/:id
exports.getById = async function (req, res, next) {
    try {
        const row = await auditLogs.getById(toId(req.params.id, 'Audit log ID'));

        if (!row) {
            throw createError(404, 'Audit log not found.');
        }

        return sendSuccess(res, row, 'Audit log retrieved.');
    } catch (error) {
        next(error);
    }
};