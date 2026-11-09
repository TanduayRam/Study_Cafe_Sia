const bcrypt = require('bcryptjs');
const User = require('../models/user_model');
const Role = require('../models/role_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

function looksLikeEmail(email) {
    const at = email.indexOf('@');
    const dot = email.lastIndexOf('.');
    return at > 0 && dot > at + 1 && dot < email.length - 1 && email.indexOf(' ') === -1;
}

// Checks the form data for both "create" and "update". Returns clean values.
async function validateUser(body, passwordRequired) {
    if (isBlank(body.name) || isBlank(body.email)) {
        throw createError(400, 'Name and email are required.');
    }
    if (looksLikeEmail(String(body.email).trim()) === false) {
        throw createError(400, 'Please enter a valid email address.');
    }
    if (passwordRequired && isBlank(body.password)) {
        throw createError(400, 'Password is required.');
    }
    if (isBlank(body.password) === false && String(body.password).length < 8) {
        throw createError(400, 'Password must contain at least 8 characters.');
    }

    const roleId = toId(body.role_id, 'Role');
    const role = await Role.getById(roleId);
    if (!role) {
        throw createError(400, 'Role must be one of the roles in the list.');
    }

    let hashedPassword = null;
    if (isBlank(body.password) === false) {
        hashedPassword = await bcrypt.hash(String(body.password), 10);
    }

    return {
        name: String(body.name).trim(),
        email: String(body.email).trim().toLowerCase(),
        password: hashedPassword,
        role_id: roleId
    };
}

// GET /users
exports.getUsers = async function(req, res, next) {
    try {
        const users = await User.getAll();
        return sendSuccess(res, users, 'Users retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /users/members - active members only, for dropdown lists
exports.getMembers = async function(req, res, next) {
    try {
        const members = await User.getActiveMembers();
        return sendSuccess(res, members, 'Members retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /users/:id
exports.getUser = async function(req, res, next) {
    try {
        const user = await User.getById(toId(req.params.id, 'User ID'));

        if (!user) {
            throw createError(404, 'User not found.');
        }

        return sendSuccess(res, user, 'User retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /users
exports.createUser = async function(req, res, next) {
    try {
        const clean = await validateUser(req.body || {}, true);

        const existing = await User.findByEmail(clean.email);
        if (existing) {
            throw createError(400, 'That email is already registered.');
        }

        const user = await User.create(clean);
        await logAction(req.user.user_id, 'CREATE', 'users', user.user_id, 'Created user ' + user.email + '.');

        return sendSuccess(res, user, 'User created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /users/:id
exports.updateUser = async function(req, res, next) {
    try {
        const id = toId(req.params.id, 'User ID');
        const body = req.body || {};

        const found = await User.getById(id);
        if (!found) {
            throw createError(404, 'User not found.');
        }

        const clean = await validateUser(body, false);

        // The email may stay the same, but it can't belong to a different user.
        const sameEmail = await User.findByEmail(clean.email);
        if (sameEmail && sameEmail.user_id !== id) {
            throw createError(400, 'That email is already registered.');
        }

        let isActive = true;
        if (body.is_active !== undefined) {
            isActive = Boolean(body.is_active);
        }

        if (id === req.user.user_id && isActive === false) {
            throw createError(400, 'You cannot deactivate your own account.');
        }

        clean.is_active = isActive;
        const user = await User.update(id, clean);
        await logAction(req.user.user_id, 'UPDATE', 'users', id, 'Updated user ' + user.email + '.');

        return sendSuccess(res, user, 'User updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /users/:id
exports.deleteUser = async function(req, res, next) {
    try {
        const id = toId(req.params.id, 'User ID');

        if (id === req.user.user_id) {
            throw createError(400, 'You cannot delete your own account.');
        }

        const result = await User.remove(id);

        if (result === 'missing') {
            throw createError(404, 'User not found.');
        }

        let action = 'DEACTIVATE';
        let message = 'This user has records in the system, so the account was deactivated instead of deleted.';
        if (result === 'deleted') {
            action = 'DELETE';
            message = 'User deleted.';
        }

        await logAction(req.user.user_id, action, 'users', id, 'User ' + id + ' was ' + result + '.');

        return sendSuccess(res, { user_id: id, result: result }, message);
    } catch (error) {
        next(error);
    }
};

// GET /roles
exports.getRoles = async function(req, res, next) {
    try {
        const roles = await Role.getAll();
        return sendSuccess(res, roles, 'Roles retrieved.');
    } catch (error) {
        next(error);
    }
};