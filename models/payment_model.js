const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

const SELECT_PAYMENT =
    'SELECT p.payment_id, p.reservation_id, u.name AS member_name, ' +
    'z.name AS zone_name, s.label AS seat_label, ' +
    'p.pass_hours_used, p.pass_amount, p.cash_amount, p.total_amount, ' +
    'p.payment_method, p.status, p.void_reason, p.paid_at ' +
    'FROM payments p ' +
    'INNER JOIN reservations r ON p.reservation_id = r.reservation_id ' +
    'INNER JOIN users u ON r.user_id = u.user_id ' +
    'INNER JOIN seats s ON r.seat_id = s.seat_id ' +
    'INNER JOIN study_zones z ON s.zone_id = z.zone_id';

async function getAll() {
    const [rows] = await db.query(SELECT_PAYMENT + ' ORDER BY p.payment_id DESC');
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_PAYMENT + ' WHERE p.payment_id = ?', [id]);
    return rows[0];
}

// Called inside the check-out transaction.
// ONE payment per reservation: the UNIQUE key on reservation_id stops a double charge.
async function create(connection, data) {
    const [result] = await connection.query(
        `INSERT INTO payments
         (reservation_id, pass_hours_used, pass_amount, cash_amount, total_amount, payment_method)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.reservation_id, data.pass_hours_used, data.pass_amount,
         data.cash_amount, data.total_amount, data.payment_method]
    );
    return getById(result.insertId, connection);
}

// Void a payment with a reason. The row stays so we keep the history.
// Returns true if it was voided, false if it was not found or already voided.
async function voidPayment(id, reason, userId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            "UPDATE payments SET status = 'Voided', void_reason = ? WHERE payment_id = ? AND status = 'Paid'",
            [reason, id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        await logAction(userId, 'VOID_PAYMENT', 'payments', id, 'Payment voided. Reason: ' + reason, connection);
         await connection.commit();
        return true;
     } catch (error) {
        await connection.rollback();
         throw error;
    } finally {
        connection.release();
    }
}

module.exports = { getAll: getAll, getById: getById, create: create, voidPayment: voidPayment };