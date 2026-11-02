const db = require('../config/databases');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM menu_items'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM menu_items WHERE menu_item_id = ?',
        [id]
    );
    return rows[0];
};

const create = async (item) => {
    const { name, category, price, stock, reorder_level } = item;

    const [result] = await db.query(
        `INSERT INTO menu_items
        (name, category, price, stock, reorder_level)
        VALUES (?, ?, ?, ?, ?)`,
        [name, category, price, stock, reorder_level]
    );

    return {
        menu_item_id: result.insertId,
        ...item
    };
};

const update = async (id, item) => {
    const { name, category, price, stock, reorder_level } = item;

    const [result] = await db.query(
        `UPDATE menu_items
        SET name = ?, category = ?, price = ?,
            stock = ?, reorder_level = ?
        WHERE menu_item_id = ?`,
        [name, category, price, stock, reorder_level, id]
    );

    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM menu_items WHERE menu_item_id = ?',
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};