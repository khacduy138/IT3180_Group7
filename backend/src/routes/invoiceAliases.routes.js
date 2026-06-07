const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const billingController = require('../controllers/billing.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize({ permission: 'invoices:read' }), billingController.listInvoices);
router.get('/:id', authorize({ permission: 'invoices:read' }), billingController.getInvoice);

module.exports = router;
