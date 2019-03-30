let router = require('express').Router();
let authMiddleware = require('../middleware/auth');

router.post('/login', authMiddleware.login);
router.post('/register', authMiddleware.register);

module.exports = router;

