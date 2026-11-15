const db = require('../config/databases');

// low_stock is 1 when stock is at or below the reorder level.
const COLUMNS = 'item_id, name, category, price, stock, reorder_level, (stock <= reorder_level) AS low_stock';

// MySQL gives 1 or 0. We turn it into true or false for the screen.
function fixLowStock(row) {
    if (row) {
        row.low_stock = Boolean(row.low_stock);
    }
    return row;
}

async function getAll() {
    const [rows] = await db.query('SELECT ' + COLUMNS + ' FROM menu_items ORDER BY category, name');
    for (let i = 0; i < rows.length; i++) {
        fixLowStock(rows[i]);
    }
    return rows;
}

async function getById(id, connection) {
    if (!connection) connection = db;
    const [rows] = await connection.query('SELECT ' + COLUMNS + ' FROM menu_items WHERE item_id = ?', [id]);
    return fixLowStock(rows[0]);
}

async function create(data) {
    const [result] = await db.query(
        'INSERT INTO menu_items (name, category, price, stock, reorder_level) VALUES (?, ?, ?, ?, ?)',
        [data.name, data.category, data.price, data.stock, data.reorder_level]
    );
    return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  await db.query(
    `UPDATE menu_items
     SET name = ?, category = ?, price = ?, stock = ?, reorder_level = ?
     WHERE item_id = ?`,
    [data.name, data.category, data.price, data.stock, data.reorder_level, id]
  );

  return getById(id);
}

async function remove(id) {
    const [result] = await db.query('DELETE FROM menu_items WHERE item_id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { getAll: getAll, getById: getById, create: create, update: update, remove: remove };
