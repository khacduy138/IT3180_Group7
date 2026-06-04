const express = require('express');

const billingController = require('../controllers/billing.controller');

const router = express.Router();

router.get('/', billingController.listInvoices);
router.get('/:id', billingController.getInvoice);
router.post('/', billingController.createInvoice);
router.post('/:id/payments', billingController.createPayment);

module.exports = router;
