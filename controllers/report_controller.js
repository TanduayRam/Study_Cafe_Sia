const reportModel = require('../models/report_model');
const memberPassReportModel = require('../models/member_pass_report_model');
const reservationOrderReportModel = require('../models/reservation_order_report_model');
const { sendSuccess } = require('../utils/http');

// All six join reports are GET endpoints that answer { success, data: [...], message }.

// GET /reports/users-roles   (INNER JOIN)
exports.usersRoles = async function (req, res, next) {
    try {
        const rows = await reportModel.getUsersRoles();
        return sendSuccess(res, rows, 'Users with their roles (INNER JOIN).');
    } catch (error) {
        next(error);
    }
};

// GET /reports/idle-seats   (LEFT JOIN)
exports.idleSeats = async function (req, res, next) {
    try {
        const rows = await reportModel.getIdleSeats();
        return sendSuccess(res, rows, 'Seats with no active reservation (LEFT JOIN).');
    } catch (error) {
        next(error);
    }
};

// GET /reports/reservation-orders   (INNER JOIN + LEFT JOIN)
exports.reservationOrders = async function (req, res, next) {
    try {
        const rows = await reservationOrderReportModel.getAll();
        return sendSuccess(res, rows, 'Reservations with seat, zone, member and order totals (INNER JOIN).');
    } catch (error) {
        next(error);
    }
};

// GET /reports/member-passes   (INNER JOIN)
exports.memberPasses = async function (req, res, next) {
    try {
        const rows = await memberPassReportModel.getAll();
        return sendSuccess(res, rows, 'Pass balance per member (INNER JOIN).');
    } catch (error) {
        next(error);
    }
};

// GET /reports/member-activity   (FULL OUTER JOIN = LEFT JOIN UNION RIGHT JOIN)
exports.memberActivity = async function (req, res, next) {
    try {
        const rows = await reportModel.getMemberActivity();
        return sendSuccess(res, rows, 'Members with passes vs members with reservations (FULL OUTER via UNION).');
    } catch (error) {
        next(error);
    }
};

// GET /reports/menu-item-orders   (RIGHT JOIN)
exports.menuItemOrders = async function (req, res, next) {
    try {
        const rows = await reportModel.getMenuItemOrders();
        return sendSuccess(res, rows, 'Order count per menu item (RIGHT JOIN).');
    } catch (error) {
        next(error);
    }
};
