const snapshotModel = require('../models/report_snapshot_model');

const createSnapshot = async (req, res) => {
    try {
        const { title, report_data } = req.body;

        if (!title || report_data === undefined || report_data === null) {
            return res.status(400).json({
                success: false,
                message: 'Title and report_data are required.'
            });
        }

        const snapshotId = await snapshotModel.createSnapshot(
            title,
            report_data
        );

        return res.status(201).json({
            success: true,
            message: 'Report snapshot saved successfully.',
            data: {
                snapshot_id: snapshotId
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Failed to save report snapshot.'
        });
    }
};

const getAllSnapshots = async (req, res) => {
    try {
        const snapshots = await snapshotModel.getAllSnapshots();

        return res.status(200).json({
            success: true,
            data: snapshots
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve report snapshots.'
        });
    }
};

const deleteSnapshot = async (req, res) => {
    try {
        const deleted = await snapshotModel.deleteSnapshot(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Snapshot not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Report snapshot deleted successfully.'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete report snapshot.'
        });
    }
};

module.exports = {
    createSnapshot,
    getAllSnapshots,
    deleteSnapshot
};