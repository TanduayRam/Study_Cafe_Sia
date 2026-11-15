const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/databases');
const jwtSettings = require('../config/jwt');
const { sendError } = require('../utils/http');

// Turns a token into a short fixed text so we can store it safely when logging out.
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Runs BEFORE a protected route. Checks the login token.
// 401 = no token, wrong token, expired token, or a token that was logged out.
async function authenticateToken(req, res, next) {
    try {
        const header = req.headers.authorization || '';

        if (header.startsWith('Bearer ') === false) {
            return sendError(res, 401, 'Authentication token required.');
        }

        const token = header.slice(7).trim();   // remove the word "Bearer "
        let decoded = null;

        try {
            decoded = jwt.verify(token, jwtSettings.secret);
        } catch (error) {
            return sendError(res, 401, 'Invalid or expired authentication token.');
        }

        // Was this token logged out before?
        const [blocked] = await db.query(
            'SELECT token_id FROM token_blacklist WHERE token_hash = ?',
            [hashToken(token)]
        );

        if (blocked.length > 0) {
            return sendError(res, 401, 'This session was logged out. Please log in again.');
        }

        req.user = decoded;   // now every controller can read req.user.user_id and req.user.role
        req.token = token;
        next();
    } catch (error) {
        next(error);
    }
}

// Builds a checker for a list of allowed roles.
// 403 = the token is fine, but this role is not allowed here.
function makeRoleCheck(allowedRoles) {
    return function (req, res, next) {
        if (!req.user || allowedRoles.includes(req.user.role) === false) {
            return sendError(res, 403, 'You do not have permission to do this.');
        }
        next();
    };
}

const isAdmin = makeRoleCheck(['Admin']);
const isAdminOrStaff = makeRoleCheck(['Admin', 'Staff']);

module.exports = {
    authenticateToken: authenticateToken,
    isAdmin: isAdmin,
    isAdminOrStaff: isAdminOrStaff,
    hashToken: hashToken
};
