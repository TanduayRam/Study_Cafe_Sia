const db = require('../config/databases');

// Create a payment
async function create(paymentData, connection = db) {
    const {
        reservation_id,
        pass_amount,
        cash_amount,
        total_amount,
        payment_method
    } = paymentData;

    const [result] = await connection.query(
        `INSERT INTO payments
        (reservation_id, pass_amount, cash_amount,
         total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?)`,
        [
            reservation_id,
            pass_amount,
            cash_amount,
            total_amount,
            payment_method
        ]
    );

    return getById(result.insertId, connection);
}

// Get one payment
async function getById(id, connection = db) {
    const [rows] = await connection.query(
        'SELECT * FROM payments WHERE payment_id = ?',
        [id]
    );

    return rows[0];
}

// Get all payments
async function getAll() {
    const [rows] = await db.query(
        'SELECT * FROM payments ORDER BY payment_id DESC'
    );

    return rows;
}

// Void a payment
async function voidPayment(id, reason) {
    const [result] = await db.query(
        `UPDATE payments
         SET status = 'Voided', void_reason = ?
         WHERE payment_id = ? AND status = 'Paid'`,
        [reason, id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    create,
    getById,
    getAll,
    voidPayment
};