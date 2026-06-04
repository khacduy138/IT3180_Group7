
const express = require('express');

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/login', authController.login);

router.post('/logout', authenticate, authController.logout);

router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
