const MemberPass = require('../models/member_pass_model');
const PassPackage = require('../models/pass_package_model');
const User = require('../models/user_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, toId } = require('../utils/http');

// GET /member-passes   (Admin, Staff)
exports.getAll = async function (req, res, next) {
    try {
        const passes = await MemberPass.getAll();
        return sendSuccess(res, passes, 'Member passes retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /member-passes/:id   (a Member can only see their own)
exports.getById = async function (req, res, next) {
    try {
        const pass = await MemberPass.getById(toId(req.params.id, 'Member pass ID'));

        if (!pass) {
            throw createError(404, 'Member pass not found.');
        }
        if (req.user.role === 'Member' && pass.user_id !== req.user.user_id) {
            throw createError(403, 'You can only view your own passes.');
        }

        return sendSuccess(res, pass, 'Member pass retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /member-passes/user/:userId   (a Member can only see their own)
exports.getByUserId = async function (req, res, next) {
    try {
        const userId = toId(req.params.userId, 'User ID');

        if (req.user.role === 'Member' && userId !== req.user.user_id) {
            throw createError(403, 'You can only view your own passes.');
        }

        const passes = await MemberPass.getByUserId(userId);
        return sendSuccess(res, passes, 'Member passes retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /member-passes   with { user_id, package_id }
exports.assign = async function (req, res, next) {
    try {
        const body = req.body || {};
        const userId = toId(body.user_id, 'User ID');
        const packageId = toId(body.package_id, 'Package ID');

        const user = await User.getById(userId);
        if (!user) {
            throw createError(404, 'User not found.');
        }
        if (user.role !== 'Member') {
            throw createError(400, 'Passes can only be assigned to members.');
        }
        if (!user.is_active) {
            throw createError(400, 'This member account is deactivated.');
        }

        const pkg = await PassPackage.getById(packageId);
        if (!pkg) {
            throw createError(404, 'Pass package not found.');
        }

        const pass = await MemberPass.assign(userId, pkg);
        await logAction(req.user.user_id, 'ASSIGN_PASS', 'member_passes', pass.member_pass_id,
            'Assigned "' + pkg.name + '" (' + pkg.hours + ' hours) to ' + user.name + '.');

        return sendSuccess(res, pass, 'Pass assigned.', 201);
    } catch (error) {
        next(error);
    }
};

// DELETE /member-passes/:id   (Admin)
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Member pass ID');
        const deleted = await MemberPass.remove(id);

        if (!deleted) {
            throw createError(404, 'Member pass not found.');
        }

        await logAction(req.user.user_id, 'DELETE', 'member_passes', id, 'Member pass removed.');

        return sendSuccess(res, { member_pass_id: id }, 'Member pass removed.');
    } catch (error) {
        next(error);
    }
};