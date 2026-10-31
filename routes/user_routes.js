const router = require('express').Router();
const user = require('../controllers/user_controller');

router.get('/', user.getUsers);
router.delete('/:id', user.deleteUser);

module.exports = router;