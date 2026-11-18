const foodSalesModel = require('../models/foodSalesModel');

const {
    sendSuccess,
    createError
} = require('../utils/http');

// Validate optional YYYY-MM-DD date parameters.
function validateDate(value, label) {
    if (!value) {
        return null;
    }

    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        throw createError(
            400,
            `${label} must use YYYY-MM-DD format.`
        );
    }

    const date = new Date(`${value}T00:00:00Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        throw createError(
            400,
            `${label} is not a valid date.`
        );
    }

    return value;
}

// Read and validate date filters.
function getDateFilters(req) {
    const startDate = validateDate(
        req.query.start_date,
        'Start date'
    );

    const endDate = validateDate(
        req.query.end_date,
        'End date'
    );

    if (startDate && endDate && startDate > endDate) {
        throw createError(
            400,
            'Start date cannot be later than end date.'
        );
    }

    return {
        startDate,
        endDate
    };
}

// GET /food-sales/summary
exports.getSummary = async function (req, res, next) {
    try {
        const { startDate, endDate } = getDateFilters(req);

        const summary = await foodSalesModel.getSummary(
            startDate,
            endDate
        );

        return sendSuccess(
            res,
            summary,
            'Food sales summary retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /food-sales/categories
exports.getSalesByCategory = async function (req, res, next) {
    try {
        const { startDate, endDate } = getDateFilters(req);

        const categories = await foodSalesModel.getSalesByCategory(
            startDate,
            endDate
        );

        return sendSuccess(
            res,
            categories,
            'Food sales by category retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /food-sales/best-sellers
exports.getBestSellingItems = async function (req, res, next) {
    try {
        const { startDate, endDate } = getDateFilters(req);

        const items = await foodSalesModel.getBestSellingItems(
            startDate,
            endDate
        );

        return sendSuccess(
            res,
            items,
            'Best-selling items retrieved.'
        );
    } catch (error) {
        next(error);
    }
};

// GET /food-sales/daily
exports.getDailySales = async function (req, res, next) {
    try {
        const { startDate, endDate } = getDateFilters(req);

        const dailySales = await foodSalesModel.getDailySales(
            startDate,
            endDate
        );

        return sendSuccess(
            res,
            dailySales,
            'Daily food sales retrieved.'
        );
    } catch (error) {
        next(error);
    }
};