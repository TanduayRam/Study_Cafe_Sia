const express = require('express');
const router = express.Router();

const menuItemController = require('../controllers/menuItemController');

router.get('/', menuItemController.getAll);
router.get('/:id', menuItemController.getById);
router.post('/', menuItemController.create);
router.put('/:id', menuItemController.update);
router.delete('/:id', menuItemController.remove);

module.exports = router;