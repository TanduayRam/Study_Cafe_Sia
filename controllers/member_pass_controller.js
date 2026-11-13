const MemberPass = require('../models/member_pass_model');
const PassPackage = require('../models/pass_package_model');
const User = require('../models/user_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, toId } = require('../utils/http');

// GET /member-passes
// Admin and Staff can retrieve all member passes.
exports.getAll = async function (req, res, next) {
    try {
        const passes = await MemberPass.getAll();

        return sendSuccess(
            res,
            passes,
            'Member passes retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /member-passes/:id
// Members can only view their own passes.
exports.getById = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Member pass ID');

        const pass = await MemberPass.getById(id);

        if (!pass) {
            throw createError(404, 'Member pass not found.');
        }

        if (
            req.user.role === 'Member' &&
            Number(pass.user_id) !== Number(req.user.user_id)
        ) {
            throw createError(
                403,
                'You can only view your own passes.'
            );
        }

        return sendSuccess(
            res,
            pass,
            'Member pass retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /member-passes/user/:userId
// Members can only retrieve their own passes.
exports.getByUserId = async function (req, res, next) {
    try {
        const userId = toId(req.params.userId, 'User ID');

        if (
            req.user.role === 'Member' &&
            Number(userId) !== Number(req.user.user_id)
        ) {
            throw createError(
                403,
                'You can only view your own passes.'
            );
        }

        const passes = await MemberPass.getByUserId(userId);

        return sendSuccess(
            res,
            passes,
            'Member passes retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// POST /member-passes
// Expected body: { user_id, package_id }
exports.assign = async function (req, res, next) {
    try {
        const body = req.body || {};

        const userId = toId(body.user_id, 'User ID');
        const packageId = toId(body.package_id, 'Package ID');

        // Verify that the target account exists.
        const user = await User.getById(userId);

        if (!user) {
            throw createError(404, 'User not found.');
        }

        if (user.role !== 'Member') {
            throw createError(
                400,
                'Passes can only be assigned to members.'
            );
        }

        if (!user.is_active) {
            throw createError(
                400,
                'This member account is deactivated.'
            );
        }

        // Verify that the selected package exists.
        const pkg = await PassPackage.getById(packageId);

        if (!pkg) {
            throw createError(404, 'Pass package not found.');
        }

        // Validate package values before creating a member pass.
        const hours = Number(pkg.hours);
        const validityDays = Number(pkg.validity_days);

        if (
            !Number.isFinite(hours) ||
            hours <= 0 ||
            !Number.isInteger(validityDays) ||
            validityDays <= 0
        ) {
            throw createError(
                400,
                'The selected pass package has invalid hours or validity.'
            );
        }

        // Assign the package to the member.
        const pass = await MemberPass.assign(userId, pkg);

        await logAction(
            req.user.user_id,
            'ASSIGN_PASS',
            'member_passes',
            pass.member_pass_id,
            'Assigned "' + pkg.name + '" (' +
                hours + ' hours) to ' + user.name + '.'
        );

        return sendSuccess(
            res,
            pass,
            'Pass assigned.',
            201
        );
    } catch (error) {
        next(error);
    }
};

// DELETE /member-passes/:id
// Admin only.
exports.remove = async function (req, res, next) {
    try {
        const id = toId(
            req.params.id,
            'Member pass ID'
        );

        const deleted = await MemberPass.remove(id);

        if (!deleted) {
            throw createError(
                404,
                'Member pass not found.'
            );
        }

        await logAction(
            req.user.user_id,
            'DELETE',
            'member_passes',
            id,
            'Member pass removed.'
        );

        return sendSuccess(
            res,
            { member_pass_id: id },
            'Member pass removed.'
        );
    } catch (error) {
        next(error);
    }
};