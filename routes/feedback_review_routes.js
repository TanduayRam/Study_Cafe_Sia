const router = require('express').Router();
const review = require('../controllers/feedback_review_controller');
const { authenticateToken } = require('../middleware/auth_middleware');

// Any logged-in user. The "who owns it" rules are checked in the controller.
router.use(authenticateToken);

router.get('/', review.getAll);
router.get('/:id', review.getById);
router.post('/', review.create);
router.put('/:id', review.update);
router.delete('/:id', review.remove);

module.exports = router;
