const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const billingController = require('../controllers/billing.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize({ permission: 'payments:read' }), billingController.listPayments);

module.exports = router;
