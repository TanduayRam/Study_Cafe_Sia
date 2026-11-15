const { createError, sendError } = require('../utils/http');

// Runs when no route matched an /api address -> 404.
function notFound(req, res, next) {
    next(createError(404, 'Route not found.'));
}

// Every error from every controller ends up here (because they call next(error)).
// This is the ONLY place that decides which message the user sees.
// The real technical error is printed in the terminal only, never sent to the user.
function errorHandler(err, req, res, next) {
    // Errors we made ourselves with createError(...) have a status number.
    if (err.status) {
        return sendError(res, err.status, err.message);
    }

    // The body of the request was not valid JSON.
    if (err.type === 'entity.parse.failed') {
        return sendError(res, 400, 'Request body is not valid JSON.');
    }

    // Common MySQL problems turned into friendly messages.
    if (err.code === 'ER_DUP_ENTRY') {
        return sendError(res, 400, 'That value already exists. Please use a different one.');
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return sendError(res, 400, 'A related record does not exist.');
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return sendError(res, 400, 'This record is used by other records and cannot be deleted.');
    }
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        return sendError(res, 400, 'One of the values is outside the allowed range.');
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
        return sendError(res, 400, 'One of the values is too long.');
    }

    // Anything else is a real bug: show it in the terminal, send a friendly message.
    console.error('Unexpected error:', err);
    return sendError(res, 500, 'Something went wrong on the server. Please try again.');
}

module.exports = { notFound: notFound, errorHandler: errorHandler };
