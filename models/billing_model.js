const db = require('../config/databases');

// Round monetary amounts to two decimal places
function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Round hours to two decimal places
function roundHours(hours) {
    return Math.round((hours + Number.EPSILON) * 100) / 100;
}

// Calculate the bill for a reservation
async function computeBill(
    reservationId,
    checkoutTime = new Date(),
    connection = db
) {
    // Validate reservation ID
    if (!Number.isInteger(Number(reservationId)) || Number(reservationId) <= 0) {
        throw new Error('Invalid reservation ID.');
    }

    // Validate checkout time
    const actualCheckoutTime = new Date(checkoutTime);

    if (isNaN(actualCheckoutTime.getTime())) {
        throw new Error('Invalid checkout time.');
    }

    // Get reservation and study zone details
    const [reservations] = await connection.query(
        `SELECT
            r.reservation_id,
            r.user_id,
            r.start_time,
            r.end_time,
            sz.name AS zone_name,
            sz.type AS zone_type,
            sz.hourly_rate
         FROM reservations r
         INNER JOIN seats s
            ON r.seat_id = s.seat_id
         INNER JOIN study_zones sz
            ON s.study_zone_id = sz.study_zone_id
         WHERE r.reservation_id = ?`,
        [reservationId]
    );

    if (reservations.length === 0) {
        throw new Error('Reservation not found.');
    }

    const reservation = reservations[0];

    // Convert reservation dates
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);

    if (
        isNaN(startTime.getTime()) ||
        isNaN(endTime.getTime()) ||
        endTime <= startTime
    ) {
        throw new Error('Invalid reservation time.');
    }

    // Calculate session duration
    const sessionHours = roundHours(
        (endTime.getTime() - startTime.getTime()) / 3600000
    );

    const hourlyRate = Number(reservation.hourly_rate);

    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
        throw new Error('Invalid study zone hourly rate.');
    }

    // Check whether the reservation is for Game Station
    const isGameStation =
        String(reservation.zone_type).toLowerCase() === 'game station' ||
        String(reservation.zone_name).toLowerCase() === 'game station';

    // Retrieve active member passes
    let memberPasses = [];

    if (!isGameStation) {
        const [passes] = await connection.query(
            `SELECT
                member_pass_id,
                remaining_hours,
                expires_on
             FROM member_passes
             WHERE user_id = ?
               AND remaining_hours > 0
               AND expires_on >= CURDATE()
             ORDER BY expires_on ASC, member_pass_id ASC
             FOR UPDATE`,
            [reservation.user_id]
        );

        memberPasses = passes;
    }

     // Calculate pass usage and remaining cash hours
    let cashHours = sessionHours;
    const passDeductions = [];

    for (const pass of memberPasses) {
        if (cashHours <= 0) {
            break;
        }

        const remainingHours = Number(pass.remaining_hours);

        if (!Number.isFinite(remainingHours) || remainingHours <= 0) {
            continue;
        }

        // Round each deduction to two decimal places
        const hoursToUse = roundHours(
            Math.min(remainingHours, cashHours)
        );

        if (hoursToUse <= 0) {
            continue;
        }

        passDeductions.push({
            member_pass_id: pass.member_pass_id,
            hours_used: hoursToUse
        });

        cashHours = roundHours(cashHours - hoursToUse);
    }

    // Calculate total pass hours used
    const passHoursUsed = roundHours(
        passDeductions.reduce(
            (total, deduction) => total + deduction.hours_used,
            0
        )
    );

    // Calculate regular session amounts
    cashHours = roundHours(Math.max(0, cashHours));

    const passAmount = roundMoney(
        passHoursUsed * hourlyRate
    );

    const cashSessionAmount = roundMoney(
        cashHours * hourlyRate
    );

    // Get served order totals for this reservation
    const [orders] = await connection.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS orders_total
         FROM orders
         WHERE reservation_id = ?
           AND status = 'Served'`,
        [reservationId]
    );

    const ordersTotal = roundMoney(
        Number(orders[0].orders_total)
    );

    if (!Number.isFinite(ordersTotal) || ordersTotal < 0) {
        throw new Error('Invalid served order total.');
    }

    // Calculate peak-hour overlap (4 PM to 8 PM)
    let peakHours = 0;

    const currentDay = new Date(startTime);
    currentDay.setHours(0, 0, 0, 0);

    while (currentDay.getTime() <= endTime.getTime()) {
        const peakStart = new Date(currentDay);
        peakStart.setHours(16, 0, 0, 0);

        const peakEnd = new Date(currentDay);
        peakEnd.setHours(20, 0, 0, 0);

        const overlapStart = Math.max(
            startTime.getTime(),
            peakStart.getTime()
        );

        const overlapEnd = Math.min(
            endTime.getTime(),
            peakEnd.getTime()
        );

        if (overlapEnd > overlapStart) {
            peakHours +=
                (overlapEnd - overlapStart) / 3600000;
        }

        currentDay.setDate(currentDay.getDate() + 1);
    }

    peakHours = roundHours(peakHours);

    // Apply 10% peak-hour surcharge,
    // even when member-pass hours are used
    const peakSurcharge = roundMoney(
        peakHours * hourlyRate * 0.10
    );

    // Calculate overtime
    const overtimeMilliseconds = Math.max(
        0,
        actualCheckoutTime.getTime() - endTime.getTime()
    );

    // Charge for every started 30-minute period
    const overtimePeriods = Math.ceil(
        overtimeMilliseconds / (30 * 60 * 1000)
    );

    const billedOvertimeHours = overtimePeriods * 0.5;

    const actualOvertimeHours = roundHours(
        overtimeMilliseconds / 3600000
    );

    const overtimeAmount = roundMoney(
        overtimePeriods * (hourlyRate / 2)
    );

    // Calculate total cash charges
    const cashAmount = roundMoney(
        cashSessionAmount +
        peakSurcharge +
        overtimeAmount +
        ordersTotal
    );

    // Calculate final amount
    const totalAmount = roundMoney(
        passAmount + cashAmount
    );

    // Return billing breakdown
    return {
        reservation_id: reservation.reservation_id,
        zone_name: reservation.zone_name,
        session_hours: sessionHours,
        pass_hours_used: passHoursUsed,
        pass_deductions: passDeductions,
        cash_hours: cashHours,
        pass_amount: passAmount,
        cash_session_amount: cashSessionAmount,
        cash_amount: cashAmount,
        peak_hours: peakHours,
        peak_surcharge: peakSurcharge,
        overtime_hours: billedOvertimeHours,
        actual_overtime_hours: actualOvertimeHours,
        overtime_amount: overtimeAmount,
        orders_total: ordersTotal,
        total_amount: totalAmount
    };
}

module.exports = {
    computeBill
};