const menuModel = require('../models/menuItemModel');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

function validateItem(body) {
    if (isBlank(body.name) || isBlank(body.category)) {
        throw createError(400, 'Item name and category are required.');
    }

    const price = Number(body.price);
    if (isBlank(body.price) || isNaN(price) || price <= 0) {
        throw createError(400, 'Price must be a number above 0.');
    }

    const stock = Number(body.stock);
    if (isBlank(body.stock) || !Number.isInteger(stock) || stock < 0) {
        throw createError(400, 'Stock must be a whole number of 0 or more.');
    }

    // If the reorder level is empty we use 5.
    let reorder = 5;
    if (isBlank(body.reorder_level) === false) {
        reorder = Number(body.reorder_level);
    }
    if (!Number.isInteger(reorder) || reorder < 0) {
        throw createError(400, 'Reorder level must be a whole number of 0 or more.');
    }

    return {
        name: String(body.name).trim(),
        category: String(body.category).trim(),
        price: price,
        stock: stock,
        reorder_level: reorder
    };
}

// GET /menu-items
exports.getAll = async function (req, res, next) {
    try {
        const items = await menuModel.getAll();
        return sendSuccess(res, items, 'Menu items retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /menu-items/:id
exports.getById = async function (req, res, next) {
    try {
        const item = await menuModel.getById(toId(req.params.id, 'Item ID'));

        if (!item) {
            throw createError(404, 'Menu item not found.');
        }

        return sendSuccess(res, item, 'Menu item retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /menu-items
exports.create = async function (req, res, next) {
    try {
        const clean = validateItem(req.body || {});
        const item = await menuModel.create(clean);
        return sendSuccess(res, item, 'Menu item created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /menu-items/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Item ID');
        const clean = validateItem(req.body || {});
        const item = await menuModel.update(id, clean);

        if (!item) {
            throw createError(404, 'Menu item not found.');
        }

        return sendSuccess(res, item, 'Menu item updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /menu-items/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Item ID');

        const item = await menuModel.getById(id);
        if (!item) {
            throw createError(404, 'Menu item not found.');
        }

        // If the item was already ordered, MySQL refuses and the error handler shows a friendly 400.
        await menuModel.remove(id);
        return sendSuccess(res, { item_id: id }, 'Menu item deleted.');
    } catch (error) {
        next(error);
    }
};
