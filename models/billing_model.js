const db = require('../config/databases');
const { createError, roundMoney } = require('../utils/http');

const HOUR_MS = 3600000;          // milliseconds in one hour
const DAY_MS = 24 * HOUR_MS;      // milliseconds in one day

// The cafe is in the Philippines (UTC+8). Needed to know when 4 PM - 8 PM is.
let OFFSET_HOURS = 8;
if (process.env.CAFE_UTC_OFFSET_HOURS !== undefined) {
    OFFSET_HOURS = Number(process.env.CAFE_UTC_OFFSET_HOURS);
}

const PEAK_START_HOUR = 16;       // 4 PM
const PEAK_END_HOUR = 20;         // 8 PM
const PEAK_SURCHARGE_RATE = 0.10; // 10 percent
const OVERTIME_BLOCK_MINUTES = 30;

// Rounds hours to 2 decimal places.
function roundHours(hours) {
    return Math.round((hours + Number.EPSILON) * 100) / 100;
}

// How many hours of the booking (start to end) fall between 4 PM and 8 PM cafe time?
function peakHoursBetween(start, end) {
    // Move the times to cafe time so "4 PM" means 4 PM in the cafe.
    const startMs = start.getTime() + OFFSET_HOURS * HOUR_MS;
    const endMs = end.getTime() + OFFSET_HOURS * HOUR_MS;

    let peakMs = 0;

    // Go through each day the booking touches (usually just one).
    let dayStart = Math.floor(startMs / DAY_MS) * DAY_MS;

    while (dayStart < endMs) {
        const peakStart = dayStart + PEAK_START_HOUR * HOUR_MS;
        const peakEnd = dayStart + PEAK_END_HOUR * HOUR_MS;

        // The overlap of the booking and the peak window.
        const overlapStart = Math.max(startMs, peakStart);
        const overlapEnd = Math.min(endMs, peakEnd);

        if (overlapEnd > overlapStart) {
            peakMs = peakMs + (overlapEnd - overlapStart);
        }

        dayStart = dayStart + DAY_MS;
    }

    return peakMs / HOUR_MS;
}

// computeBill(reservationId, checkoutTime, connection)
// Works out how much a reservation costs. It only READS the database, it never changes it.
// Check-out calls it inside its transaction and then saves the result.
async function computeBill(reservationId, checkoutTime, connection) {
    if (!checkoutTime) checkoutTime = new Date();
    if (!connection) connection = db;

    // 1. Get the reservation with its zone (we need the rate and zone type).
    const [rows] = await connection.query(
        `SELECT r.reservation_id, r.user_id, r.status, r.start_time, r.end_time,
                z.name AS zone_name, z.type AS zone_type, z.hourly_rate
         FROM reservations r
         INNER JOIN seats s ON r.seat_id = s.seat_id
         INNER JOIN study_zones z ON s.zone_id = z.zone_id
         WHERE r.reservation_id = ?`,
        [reservationId]
    );

    if (rows.length === 0) {
        throw createError(404, 'Reservation not found.');
    }

    const reservation = rows[0];
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    const rate = Number(reservation.hourly_rate);
    const sessionHours = roundHours((end - start) / HOUR_MS);

    // RULE: passes cover study zones only. Game Station is always paid in cash.
    const isGameStation = (reservation.zone_type === 'Game Station');

    // 2. RULE: use the member's active, not-expired pass hours first. Earliest expiry first.
    let passes = [];
    if (isGameStation === false) {
        const [passRows] = await connection.query(
            `SELECT member_pass_id, remaining_hours
             FROM member_passes
             WHERE user_id = ? AND remaining_hours > 0 AND expires_on >= UTC_DATE()
             ORDER BY expires_on ASC, member_pass_id ASC
             FOR UPDATE`,
            [reservation.user_id]
        );
        passes = passRows;
    }

    // Take hours from each pass until the booking is covered or the passes run out.
    let hoursLeft = sessionHours;
    const passDeductions = [];
    let passHoursUsed = 0;

    for (let i = 0; i < passes.length; i++) {
        if (hoursLeft <= 0) {
            break;
        }

        let hoursToUse = Number(passes[i].remaining_hours);
        if (hoursLeft < hoursToUse) {
            hoursToUse = hoursLeft;
        }
        hoursToUse = roundHours(hoursToUse);

        if (hoursToUse > 0) {
            passDeductions.push({ member_pass_id: passes[i].member_pass_id, hours_used: hoursToUse });
            passHoursUsed = roundHours(passHoursUsed + hoursToUse);
            hoursLeft = roundHours(hoursLeft - hoursToUse);
        }
    }

    // Whatever the passes could not cover is paid in cash.
    let cashHours = hoursLeft;
    if (cashHours < 0) cashHours = 0;
    cashHours = roundHours(cashHours);

    const passAmount = roundMoney(passHoursUsed * rate);
    const cashSeatAmount = roundMoney(cashHours * rate);

    // 3. RULE: peak hours (4 PM - 8 PM) add 10 percent of the zone rate.
    const peakHours = roundHours(peakHoursBetween(start, end));
    const peakSurcharge = roundMoney(peakHours * rate * PEAK_SURCHARGE_RATE);

    // 4. RULE: time past the end is overtime. Billed in cash per STARTED 30 minutes.
    //    A pass never covers overtime.
    const checkoutDate = new Date(checkoutTime);
    let lateMs = checkoutDate.getTime() - end.getTime();
    if (lateMs < 0) lateMs = 0;
    const overtimeBlocks = Math.ceil(lateMs / (OVERTIME_BLOCK_MINUTES * 60000));
    const overtimeAmount = roundMoney(overtimeBlocks * (rate * OVERTIME_BLOCK_MINUTES / 60));

    // 5. Food and drinks ordered during the visit (cancelled orders do not count).
    const [orderRows] = await connection.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS orders_total
         FROM orders
         WHERE reservation_id = ? AND status <> 'Cancelled'`,
        [reservationId]
    );
    const ordersTotal = roundMoney(orderRows[0].orders_total);

    // 6. Totals.
    const cashAmount = roundMoney(cashSeatAmount + overtimeAmount + peakSurcharge + ordersTotal);
    const totalAmount = roundMoney(passAmount + cashAmount);

    return {
        reservation_id: reservation.reservation_id,
        status: reservation.status,
        zone_name: reservation.zone_name,
        zone_type: reservation.zone_type,
        hourly_rate: rate,
        pass_allowed: !isGameStation,
        session_hours: sessionHours,
        pass_hours_used: passHoursUsed,
        pass_deductions: passDeductions,
        cash_hours: cashHours,
        pass_amount: passAmount,
        cash_seat_amount: cashSeatAmount,
        peak_hours: peakHours,
        peak_surcharge: peakSurcharge,
        overtime_blocks: overtimeBlocks,
        overtime_hours: overtimeBlocks * OVERTIME_BLOCK_MINUTES / 60,
        overtime_amount: overtimeAmount,
        orders_total: ordersTotal,
        cash_amount: cashAmount,
        total_amount: totalAmount,
        computed_for: checkoutDate
    };
}

module.exports = { computeBill: computeBill, peakHoursBetween: peakHoursBetween };