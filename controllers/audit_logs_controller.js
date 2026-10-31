const auditLogs = require('../models/audit_logs_model');

exports.getAll = async (req, res) => {
    try {
        const data = await auditLogs.getAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await auditLogs.findById(req.params.id);

        if (!data) {
            return res.status(404).json({ message: 'Audit log not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            userId,
            action,
            tableName,
            recordId,
            description
        } = req.body;

        const id = await auditLogs.create(
            userId,
            action,
            tableName,
            recordId,
            description
        );

        res.status(201).json({
            message: 'Audit log created successfully',
            id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await auditLogs.remove(req.params.id);
        res.json({ message: 'Audit log deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
