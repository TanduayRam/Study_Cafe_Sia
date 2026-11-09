const PassPackage = require('../models/pass_package_model');
const { createError, sendSuccess, toId, isBlank } = require('../utils/http');

function validatePackage(body) {
    if (isBlank(body.name)) {
        throw createError(400, 'Package name is required.');
    }

    const hours = Number(body.hours);
    if (isBlank(body.hours) || isNaN(hours) || hours <= 0) {
        throw createError(400, 'Hours must be a number above 0.');
    }

    const price = Number(body.price);
    if (isBlank(body.price) || isNaN(price) || price <= 0) {
        throw createError(400, 'Price must be a number above 0.');
    }

    const days = Number(body.validity_days);
    if (isBlank(body.validity_days) || !Number.isInteger(days) || days <= 0) {
        throw createError(400, 'Validity days must be a whole number above 0.');
    }

    let description = null;
    if (isBlank(body.description) === false) {
        description = String(body.description).trim();
    }

    return {
        name: String(body.name).trim(),
        hours: hours,
        price: price,
        description: description,
        validity_days: days
    };
}

// GET /pass-packages
exports.getAll = async function (req, res, next) {
    try {
        const packages = await PassPackage.getAll();
        return sendSuccess(res, packages, 'Pass packages retrieved.');
    } catch (error) {
        next(error);
    }
};

// GET /pass-packages/:id
exports.getById = async function (req, res, next) {
    try {
        const pkg = await PassPackage.getById(toId(req.params.id, 'Package ID'));

        if (!pkg) {
            throw createError(404, 'Pass package not found.');
        }

        return sendSuccess(res, pkg, 'Pass package retrieved.');
    } catch (error) {
        next(error);
    }
};

// POST /pass-packages
exports.create = async function (req, res, next) {
    try {
        const clean = validatePackage(req.body || {});
        const pkg = await PassPackage.create(clean);
        return sendSuccess(res, pkg, 'Pass package created.', 201);
    } catch (error) {
        next(error);
    }
};

// PUT /pass-packages/:id
exports.update = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Package ID');
        const clean = validatePackage(req.body || {});
        const pkg = await PassPackage.update(id, clean);

        if (!pkg) {
            throw createError(404, 'Pass package not found.');
        }

        return sendSuccess(res, pkg, 'Pass package updated.');
    } catch (error) {
        next(error);
    }
};

// DELETE /pass-packages/:id
exports.remove = async function (req, res, next) {
    try {
        const id = toId(req.params.id, 'Package ID');

        // If members already own this package, MySQL refuses and the error handler shows a friendly 400.
        const deleted = await PassPackage.remove(id);
         if (!deleted) {
            throw createError(404, 'Pass package not found.');
        }

        return sendSuccess(res, { package_id: id }, 'Pass package deleted.');
    } catch (error) {
        next(error);
    }
 };