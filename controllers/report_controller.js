const reportModel = require('../models/report_model');

// GET MENU ITEM ORDER REPORT
const getMenuItemOrders = async (req, res) => {
    try {
        const report = await reportModel.getMenuItemOrders();

        return res.status(200).json({
            success: true,
            message: 'Menu item order report retrieved successfully.',
            data: report
        });
    } catch (error) {
        console.error('Report Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve menu item order report.'
        });
    }
};

module.exports = {
    getMenuItemOrders
};