const express = require('express');
const router = express.Router();

const PassPackageController = require('../controllers/pass_package_controller');

// Get all pass packages
router.get('/', PassPackageController.getAll);

// Get one pass package
router.get('/:id', PassPackageController.getById);

// Create a pass package
router.post('/', PassPackageController.create);

// Update a pass package
router.put('/:id', PassPackageController.update);

// Delete a pass package
router.delete('/:id', PassPackageController.remove);

module.exports = router;