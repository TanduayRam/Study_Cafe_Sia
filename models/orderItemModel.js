const db = require('../config/databases');
const { createError, roundMoney } = require('../utils/http');

// One line of an order, with the item name.
const SELECT_ITEM =
    'SELECT oi.order_item_id, oi.order_id, oi.item_id, m.name AS item_name, ' +
    'oi.quantity, oi.unit_price, oi.subtotal ' +
    'FROM order_items oi INNER JOIN menu_items m ON oi.item_id = m.item_id';

async function getAll(filters) {
    if (!filters) filters = {};

    let sql = SELECT_ITEM;
    const values = [];

    if (filters.order_id) {
        sql = sql + ' WHERE oi.order_id = ?';
        values.push(filters.order_id);
    }

    sql = sql + ' ORDER BY oi.order_item_id DESC';
    const [rows] = await db.query(sql, values);
    return rows;
}

async function getByOrderId(orderId, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query(SELECT_ITEM + ' WHERE oi.order_id = ? ORDER BY oi.order_item_id', [orderId]);
    return rows;
}

async function getById(id) {
    const [rows] = await db.query(SELECT_ITEM + ' WHERE oi.order_item_id = ?', [id]);
    return rows[0];
}

// Checks the list [{ item_id, quantity }] and joins duplicates (same item twice becomes one line).
// Returns the list sorted by item_id. Throws 400 if something is wrong.
function normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw createError(400, 'Add at least one menu item.');
    }

    const lines = [];

    for (let i = 0; i < items.length; i++) {
        const itemId = Number(items[i] && items[i].item_id);
        const quantity = Number(items[i] && items[i].quantity);

        if (!Number.isInteger(itemId) || itemId <= 0) {
            throw createError(400, 'Each line needs a valid menu item.');
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw createError(400, 'Each quantity must be a whole number above 0.');
        }

        // If this item is already in our list, just add to its quantity.
        let found = false;
        for (let j = 0; j < lines.length; j++) {
            if (lines[j].item_id === itemId) {
                lines[j].quantity = lines[j].quantity + quantity;
                found = true;
            }
        }
        if (found === false) {
            lines.push({ item_id: itemId, quantity: quantity });
        }
    }

    // Always process items in the same order (this avoids database deadlocks).
    lines.sort(function (a, b) {
        return a.item_id - b.item_id;
    });

    return lines;
}

// Runs inside the caller's transaction.
// RULE: if the quantity is more than the stock, we refuse with 400.
async function insertItems(connection, orderId, lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // FOR UPDATE locks this menu row so nobody else can change the stock meanwhile.
        const [menu] = await connection.query(
            'SELECT item_id, name, price, stock FROM menu_items WHERE item_id = ? FOR UPDATE',
            [line.item_id]
        );

        if (menu.length === 0) {
            throw createError(404, 'Menu item ' + line.item_id + ' was not found.');
        }

        const item = menu[0];

        if (item.stock < line.quantity) {
            throw createError(400, 'Not enough stock for ' + item.name + '. Only ' + item.stock + ' left.');
        }

        // Subtract the stock.
        await connection.query('UPDATE menu_items SET stock = stock - ? WHERE item_id = ?', [line.quantity, line.item_id]);

        // Save the order line with the price at this moment.
        await connection.query(
            'INSERT INTO order_items (order_id, item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, line.item_id, line.quantity, item.price, roundMoney(item.price * line.quantity)]
        );
    }
}

module.exports = {
    getAll: getAll,
    getByOrderId: getByOrderId,
    getById: getById,
    normalizeItems: normalizeItems,
    insertItems: insertItems
};
