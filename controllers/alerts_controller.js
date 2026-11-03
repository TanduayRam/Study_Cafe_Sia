
const alerts = require('../models/alerts_model');

exports.getAll = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            type: req.query.type
        };

        const data = await alerts.getAll(filters);
        res.json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await alerts.findById(req.params.id);

        if (!data) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { userId, message, alertType } = req.body;

        if (!userId || !message || !alertType) {
            return res.status(400).json({
                message: 'userId, message, and alertType are required.'
            });
        }

        const id = await alerts.create(userId, message, alertType);

        res.status(201).json({
            message: 'Alert created successfully',
            id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const data = await alerts.findById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        await alerts.markAsRead(req.params.id);

        res.json({
            message: 'Alert marked as read'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.acknowledge = async (req, res) => {
    try {
        const updated = await alerts.acknowledge(req.params.id);

        if (!updated) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        res.json({
            message: 'Alert acknowledged successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resolve = async (req, res) => {
    try {
        const updated = await alerts.resolve(req.params.id);

        if (!updated) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        res.json({
            message: 'Alert resolved successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await alerts.findById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        await alerts.remove(req.params.id);

        res.json({
            message: 'Alert deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
