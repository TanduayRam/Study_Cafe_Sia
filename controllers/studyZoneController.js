const studyZoneModel = require('../models/studyZoneModel');

const getAll = async (req, res) => {
    try {
        const zones = await studyZoneModel.getAll();
        res.status(200).json(zones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const zone = await studyZoneModel.getById(req.params.id);

        if (!zone) {
            return res.status(404).json({ message: 'Study zone not found' });
        }

        res.status(200).json(zone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const zone = await studyZoneModel.create(req.body);
        res.status(201).json(zone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const existing = await studyZoneModel.getById(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: 'Study zone not found' });
        }

        const result = await studyZoneModel.update(req.params.id, req.body);
        res.status(200).json({ message: 'Study zone updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const remove = async (req, res) => {
    try {
        const result = await studyZoneModel.remove(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Study zone not found' });
        }

        res.status(200).json({ message: 'Study zone deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};