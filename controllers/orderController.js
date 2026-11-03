const db = require('../config/databases');
const orderModel = require('../models/orderModel');
const orderItemModel = require('../models/orderItemModel');

// Get all orders
const getAll = async (req, res) => {
    try {
        const orders = await orderModel.getAll();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get one order with its items
const getById = async (req, res) => {
    try {
        const order = await orderModel.getById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        const items = await orderItemModel.getByOrderId(req.params.id);

        res.status(200).json({
            ...order,
            items
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new order
const create = async (req, res) => {
    const { reservation_id, items } = req.body;

    if (!Number.isInteger(Number(reservation_id)) ||
        Number(reservation_id) <= 0) {
        return res.status(400).json({
            message: 'A valid reservation ID is required.'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: 'At least one menu item is required.'
        });
    }

    const itemQuantities = new Map();

    for (const item of items) {
        const menuItemId = Number(item.menu_item_id);
        const quantity = Number(item.quantity);

        if (!Number.isInteger(menuItemId) || menuItemId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: 'Each item must have a valid menu item ID and positive quantity.'
            });
        }

        itemQuantities.set(
            menuItemId,
            (itemQuantities.get(menuItemId) || 0) + quantity
        );
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check and lock the reservation
        const [reservations] = await connection.query(
            `SELECT * FROM reservations
             WHERE reservation_id = ?
             FOR UPDATE`,
            [reservation_id]
        );

        if (reservations.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Reservation not found.'
            });
        }

        if (reservations[0].status !== 'CheckedIn') {
            await connection.rollback();
            return res.status(400).json({
                message: 'Orders can only be placed for checked-in reservations.'
            });
        }

        // Create the order
        const orderId = await orderModel.create(
            connection,
            reservation_id
        );

        let totalCents = 0;

        // Process each menu item
        for (const [menuItemId, quantity] of itemQuantities) {

            // Lock the menu item while checking its stock
            const [menuItems] = await connection.query(
                `SELECT * FROM menu_items
                 WHERE menu_item_id = ?
                 FOR UPDATE`,
                [menuItemId]
            );

            if (menuItems.length === 0) {
                throw new Error(`Menu item ${menuItemId} not found.`);
            }

            const menuItem = menuItems[0];

            if (menuItem.stock < quantity) {
                throw new Error(
                    `Not enough stock for ${menuItem.name}. Available: ${menuItem.stock}.`
                );
            }

            // Calculate subtotal using integer cents
            const unitPriceCents = Math.round(
                Number(menuItem.price) * 100
            );

            const subtotalCents = unitPriceCents * quantity;
            totalCents += subtotalCents;

            // Deduct menu stock
            await connection.query(
                `UPDATE menu_items
                 SET stock = stock - ?
                 WHERE menu_item_id = ?`,
                [quantity, menuItemId]
            );

            // Save the order item
            await orderItemModel.create(connection, {
                order_id: orderId,
                menu_item_id: menuItemId,
                quantity,
                unit_price: menuItem.price,
                subtotal: (subtotalCents / 100).toFixed(2)
            });
        }

        // Save the final order total
        const total = (totalCents / 100).toFixed(2);

        await orderModel.updateTotal(
            connection,
            orderId,
            total
        );

        await connection.commit();

        res.status(201).json({
            message: 'Order created successfully.',
            order_id: orderId,
            reservation_id: Number(reservation_id),
            total_amount: total,
            status: 'Pending'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        const statusCode = error.message.includes('not found') ||
            error.message.includes('Not enough stock') ? 400 : 500;

        res.status(statusCode).json({
            message: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    getAll,
    getById,
    create
};
