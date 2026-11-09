const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/databases');
const jwtSettings = require('../config/jwt');
const { hashToken } = require('../middleware/auth_middleware');
const User = require('../models/user_model');
const Role = require('../models/role_model');
const logAction = require('../utils/audit_logger');
const { createError, sendSuccess, isBlank } = require('../utils/http');

// A very simple email check: text@text.text
function looksLikeEmail(email) {
    const at = email.indexOf('@');
    const dot = email.lastIndexOf('.');
    return at > 0 && dot > at + 1 && dot < email.length - 1 && email.indexOf(' ') === -1;
}

// POST /auth/register - anyone can sign up. The new account is always a Member.
exports.register = async function(req, res, next) {
    try {
        const body = req.body || {};

        if (isBlank(body.name) || isBlank(body.email) || isBlank(body.password)) {
            throw createError(400, 'Name, email and password are required.');
        }
        if (looksLikeEmail(String(body.email).trim()) === false) {
            throw createError(400, 'Please enter a valid email address.');
        }
        if (String(body.password).length < 8) {
            throw createError(400, 'Password must contain at least 8 characters.');
        }

        const email = String(body.email).trim().toLowerCase();

        const existing = await User.findByEmail(email);
        if (existing) {
            throw createError(400, 'That email is already registered.');
        }

        const memberRole = await Role.getByName('Member');
        const hashedPassword = await bcrypt.hash(String(body.password), 10); // never store the real password

        const user = await User.create({
            name: String(body.name).trim(),
            email: email,
            password: hashedPassword,
            role_id: memberRole.role_id
        });

        return sendSuccess(res, user, 'Registration successful. You can log in now.', 201);
    } catch (error) {
        next(error);
    }
};

// POST /auth/login
exports.login = async function(req, res, next) {
    try {
        const body = req.body || {};

        if (isBlank(body.email) || isBlank(body.password)) {
            throw createError(400, 'Email and password are required.');
        }

        const user = await User.findByEmail(String(body.email).trim().toLowerCase());

        // We give the same message for "no such email" and "wrong password" on purpose.
        if (!user) {
            throw createError(401, 'Invalid email or password.');
        }
        const passwordIsCorrect = await bcrypt.compare(String(body.password), user.password);
        if (passwordIsCorrect === false) {
            throw createError(401, 'Invalid email or password.');
        }

        if (!user.is_active) {
            throw createError(403, 'This account has been deactivated.');
        }

        // The token holds the user id, name and role. It is signed with our secret.
        const token = jwt.sign({ user_id: user.user_id, name: user.name, role: user.role },
            jwtSettings.secret, { expiresIn: jwtSettings.expiresIn }
        );

        await logAction(user.user_id, 'LOGIN', 'users', user.user_id, user.name + ' logged in.');

        return sendSuccess(res, {
            token: token,
            user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
        }, 'Login successful.');
    } catch (error) {
        next(error);
    }
};

// POST /auth/logout - the token is saved in token_blacklist so it can't be used again.
exports.logout = async function(req, res, next) {
    try {
        const expiresAt = new Date(req.user.exp * 1000);

        await db.query(
            'INSERT IGNORE INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)', [hashToken(req.token), expiresAt]
        );

        // Clean up old tokens that have expired anyway.
        await db.query('DELETE FROM token_blacklist WHERE expires_at < UTC_TIMESTAMP()');

        await logAction(req.user.user_id, 'LOGOUT', 'users', req.user.user_id, req.user.name + ' logged out.');

        return sendSuccess(res, null, 'Logged out successfully.');
    } catch (error) {
        next(error);
    }
};

// GET /auth/me - who am I?
exports.me = async function(req, res, next) {
    try {
        const user = await User.getById(req.user.user_id);

        if (!user) {
            throw createError(404, 'User not found.');
        }

        return sendSuccess(res, user, 'Current user.');
    } catch (error) {
        next(error);
    }
};