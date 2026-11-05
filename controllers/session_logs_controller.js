const sessionLogs = require('../models/session_logs_model');

exports.getAll = async (req, res) => {
    try {
        const logs = await sessionLogs.getAll();
        res.json(logs);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const log = await sessionLogs.findById(req.params.id);

        if (!log) {
            return res.status(404).json({
                message: 'Session log not found'
            });
        }

        res.json(log);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            userId,
            studyZoneId,
            startTime,
            expectedEndTime,
            endTime,
            status
        } = req.body;

        if (!userId || !studyZoneId || !startTime || !expectedEndTime || !status) {
            return res.status(400).json({
                message: 'userId, studyZoneId, startTime, expectedEndTime, and status are required.'
            });
        }

        const id = await sessionLogs.create(
            userId,
            studyZoneId,
            startTime,
            expectedEndTime,
            endTime || null,
            status
        );

        res.status(201).json({
            message: 'Session log created successfully',
            id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { endTime, status } = req.body;

        if (!endTime || !status) {
            return res.status(400).json({
                message: 'endTime and status are required.'
            });
        }

        const updated = await sessionLogs.update(
            req.params.id,
            endTime,
            status
        );

        if (!updated) {
            return res.status(404).json({
                message: 'Session log not found'
            });
        }

        res.json({
            message: 'Session log updated and audit log recorded successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await sessionLogs.remove(req.params.id);

        res.json({
            message: 'Session log deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};