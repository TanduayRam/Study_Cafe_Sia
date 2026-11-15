// Small helper functions used by many files.
// Every answer from our API uses the same JSON shape:
//   success:  { success: true,  data: ..., message: '...' }
//   error:    { success: false, error: { code: '...', message: '...' } }

// Makes an error that carries a status code (400, 404, ...).
// We use it like:  throw createError(400, 'Name is required.');
function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Sends a success answer.
function sendSuccess(res, data, message, status) {
    if (data === undefined) data = null;
    if (!message) message = 'OK';
    if (!status) status = 200;
    return res.status(status).json({ success: true, data: data, message: message });
}

// Sends an error answer.
function sendError(res, status, message) {
    let code = 'ERROR';
    if (status === 400) code = 'BAD_REQUEST';
    if (status === 401) code = 'UNAUTHORIZED';
    if (status === 403) code = 'FORBIDDEN';
    if (status === 404) code = 'NOT_FOUND';
    if (status === 500) code = 'SERVER_ERROR';
    return res.status(status).json({ success: false, error: { code: code, message: message } });
}

// Checks that a value is a whole number bigger than 0 (used for ids).
function toId(value, label) {
    if (!label) label = 'ID';
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw createError(400, label + ' must be a positive whole number.');
    }
    return number;
}

// Checks that a value is a real date and returns it as a Date.
function toDate(value, label) {
    if (!label) label = 'Date';
    const date = new Date(value);
    if (value === undefined || value === null || value === '' || isNaN(date.getTime())) {
        throw createError(400, label + ' is not a valid date and time.');
    }
    return date;
}

// True when a value is missing or only spaces.
function isBlank(value) {
    if (value === undefined || value === null) return true;
    return String(value).trim() === '';
}

// Rounds money to 2 decimal places.
function roundMoney(amount) {
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

module.exports = {
    createError: createError,
    sendSuccess: sendSuccess,
    sendError: sendError,
    toId: toId,
    toDate: toDate,
    isBlank: isBlank,
    roundMoney: roundMoney
};
