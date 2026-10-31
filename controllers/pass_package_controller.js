const PassPackage = require('../models/pass_package_model');

// GET all pass packages
exports.getAll = async (req, res) => {
    try {
        const packages = await PassPackage.getAll();

        res.status(200).json({
            success: true,
            data: packages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pass packages.'
        });
    }
};

// GET one pass package
exports.getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pass package ID.'
            });
        }

        const packageData = await PassPackage.getById(id);

        if (!packageData) {
            return res.status(404).json({
                success: false,
                message: 'Pass package not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: packageData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pass package.'
        });
    }
};

// POST create pass package
exports.create = async (req, res) => {
    try {
        const { name, hours, price, description, validity_days } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Package name is required.'
            });
        }

        if (!Number.isFinite(Number(hours)) || Number(hours) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hours must be greater than zero.'
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than zero.'
            });
        }

        if (!Number.isInteger(Number(validity_days)) || Number(validity_days) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validity days must be a positive integer.'
            });
        }

        const newPackage = await PassPackage.create({
            name: name.trim(),
            hours: Number(hours),
            price: Number(price),
            description,
            validity_days: Number(validity_days)
        });

        res.status(201).json({
            success: true,
            message: 'Pass package created successfully.',
            data: newPackage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create pass package.'
        });
    }
};

// PUT update pass package
exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, hours, price, description, validity_days } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pass package ID.'
            });
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Package name is required.'
            });
        }

        if (!Number.isFinite(Number(hours)) || Number(hours) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hours must be greater than zero.'
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than zero.'
            });
        }

        if (!Number.isInteger(Number(validity_days)) || Number(validity_days) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validity days must be a positive integer.'
            });
        }

        const updatedPackage = await PassPackage.update(id, {
            name: name.trim(),
            hours: Number(hours),
            price: Number(price),
            description,
            validity_days: Number(validity_days)
        });

        if (!updatedPackage) {
            return res.status(404).json({
                success: false,
                message: 'Pass package not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pass package updated successfully.',
            data: updatedPackage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update pass package.'
        });
    }
};

// DELETE pass package
exports.remove = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pass package ID.'
            });
        }

        const deleted = await PassPackage.remove(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Pass package not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pass package deleted successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete pass package.'
        });
    }
};
