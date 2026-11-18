const db = require('../config/databases');
const logAction = require('../utils/audit_logger');

// Shared query for retrieving payment details.
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

// Round hours to two decimal places.
function roundHours(hours) {
    return Math.round(
        (Number(hours) + Number.EPSILON) * 100
    ) / 100;
}

// GET all payments.
async function getAll() {
    const [rows] = await db.query(
        SELECT_PAYMENT + ' ORDER BY p.payment_id DESC'
    );

    return rows;
}

// GET one payment by ID.
// An optional connection allows this function to run inside a transaction.
async function getById(id, connection) {
    const executor = connection || db;

    const [rows] = await executor.query(
        SELECT_PAYMENT + ' WHERE p.payment_id = ?',
        [id]
    );

    return rows[0] || null;
}

// CREATE a payment and record its individual member-pass deductions.
// This function must run inside the checkout transaction.
async function create(connection, data) {
    const deductions = Array.isArray(data.pass_deductions)
        ? data.pass_deductions
        : [];

    // Combine repeated entries for the same member pass.
    const deductionMap = new Map();

    for (const deduction of deductions) {
        const passId = Number(deduction.member_pass_id);
        const hours = Number(deduction.hours_used);

        if (
            !Number.isInteger(passId) ||
            passId <= 0 ||
            !Number.isFinite(hours) ||
            hours <= 0
        ) {
            throw new Error('Invalid member-pass deduction data.');
        }

        const current = deductionMap.get(passId) || 0;
        deductionMap.set(passId, current + hours);
    }

    const normalizedDeductions = Array.from(
        deductionMap.entries()
    ).map(function (entry) {
        return {
            member_pass_id: entry[0],
            hours_used: roundHours(entry[1])
        };
    });

    const recordedHours = roundHours(
        normalizedDeductions.reduce(
            function (total, deduction) {
                return total + deduction.hours_used;
            },
            0
        )
    );

    const expectedHours = Number(data.pass_hours_used || 0);

    if (
        !Number.isFinite(expectedHours) ||
        expectedHours < 0 ||
        Math.abs(recordedHours - expectedHours) > 0.001
    ) {
        throw new Error(
            'Member-pass deductions do not match the payment pass hours.'
        );
    }

    if (expectedHours > 0 && normalizedDeductions.length === 0) {
        throw new Error(
            'Member-pass deduction records are required for this payment.'
        );
    }

    if (expectedHours === 0 && normalizedDeductions.length > 0) {
        throw new Error(
            'Pass deductions cannot be recorded when no pass hours were used.'
        );
    }

    // Create the payment record.
    const [result] = await connection.query(
        `INSERT INTO payments
            (
                reservation_id,
                pass_hours_used,
                pass_amount,
                cash_amount,
                total_amount,
                payment_method
            )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            data.reservation_id,
            expectedHours,
            data.pass_amount,
            data.cash_amount,
            data.total_amount,
            data.payment_method
        ]
    );

    const paymentId = result.insertId;

    // Save exactly which member passes supplied the hours.
    for (const deduction of normalizedDeductions) {
        await connection.query(
            `INSERT INTO payment_pass_deductions
                (payment_id, member_pass_id, hours_used)
             VALUES (?, ?, ?)`,
            [
                paymentId,
                deduction.member_pass_id,
                deduction.hours_used
            ]
        );
    }

    return getById(paymentId, connection);
}

// VOID a payment and restore its original member-pass hours.
// All changes happen inside one database transaction.
async function voidPayment(id, reason, userId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the payment to prevent simultaneous void requests.
        const [paymentRows] = await connection.query(
            `SELECT payment_id, pass_hours_used, status
             FROM payments
             WHERE payment_id = ?
             FOR UPDATE`,
            [id]
        );

        if (paymentRows.length === 0) {
            await connection.rollback();
            return false;
        }

        const payment = paymentRows[0];

        // Only a Paid payment can be voided.
        if (payment.status !== 'Paid') {
            await connection.rollback();
            return false;
        }

        // Retrieve the exact passes used by this payment.
        const [deductions] = await connection.query(
            `SELECT
                member_pass_id,
                hours_used
             FROM payment_pass_deductions
             WHERE payment_id = ?
             ORDER BY member_pass_id ASC`,
            [id]
        );

        const recordedHours = roundHours(
            deductions.reduce(
                function (total, deduction) {
                    return total + Number(deduction.hours_used);
                },
                0
            )
        );

        const paymentHours = roundHours(payment.pass_hours_used);

        // Never void a payment if its pass-deduction records are incomplete.
        if (Math.abs(recordedHours - paymentHours) > 0.001) {
            throw new Error(
                'Payment pass-deduction records are incomplete. ' +
                'The payment was not voided.'
            );
        }

        // Restore each deduction to its original member pass.
        for (const deduction of deductions) {
            const passId = Number(deduction.member_pass_id);
            const hours = Number(deduction.hours_used);

            if (
                !Number.isInteger(passId) ||
                passId <= 0 ||
                !Number.isFinite(hours) ||
                hours <= 0
            ) {
                throw new Error(
                    'Invalid pass-deduction record. ' +
                    'The payment was not voided.'
                );
            }

            const [restoreResult] = await connection.query(
                `UPDATE member_passes
                 SET remaining_hours = remaining_hours + ?
                 WHERE member_pass_id = ?`,
                [hours, passId]
            );

            if (restoreResult.affectedRows !== 1) {
                throw new Error(
                    'A member pass could not be restored. ' +
                    'The payment was not voided.'
                );
            }
        }

        // Mark the payment as voided after restoring all pass hours.
        const [updateResult] = await connection.query(
            `UPDATE payments
             SET status = 'Voided',
                 void_reason = ?
             WHERE payment_id = ?
               AND status = 'Paid'`,
            [reason, id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error(
                'The payment could not be voided.'
            );
        }

        // Record the action in the audit log using the same transaction.
        await logAction(
            userId,
            'VOID_PAYMENT',
            'payments',
            id,
            'Payment voided. Reason: ' + reason +
                '. Restored pass hours: ' + recordedHours + '.',
            connection
        );

        await connection.commit();

        return true;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Payment void rollback error:', rollbackError);
        }

        throw error;
    } finally {
        connection.release();
    }
}

// Export model functions.
module.exports = {
    getAll: getAll,
    getById: getById,
    create: create,
    voidPayment: voidPayment
};