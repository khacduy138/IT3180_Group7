const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const billingController = require('../controllers/billing.controller');

const router = express.Router();

router.use(authenticate);

router.get('/payments', authorize({ permission: 'payments:read' }), billingController.listPayments);
router.get('/', authorize({ permission: 'invoices:read' }), billingController.listInvoices);
router.get('/:id', authorize({ permission: 'invoices:read' }), billingController.getInvoice);
router.post('/', authorize({ permission: 'invoices:write' }), billingController.createInvoice);
router.post('/:id/payments', authorize({ permission: 'payments:write' }), billingController.createPayment);

module.exports = router;