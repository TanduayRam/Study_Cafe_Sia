const menuItemModel = require('../models/menuItemModel');

const getAll = async (req, res) => {
    try {
        const items = await menuItemModel.getAll();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const item = await menuItemModel.getById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const item = await menuItemModel.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const existing = await menuItemModel.getById(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const result = await menuItemModel.update(req.params.id, req.body);
        res.status(200).json({ message: 'Menu item updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const result = await menuItemModel.remove(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.status(200).json({ message: 'Menu item deleted successfully' });
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