'use strict';

const express = require('express');

const router = express.Router();

/*
 * Module 3 — Fee Management Routes
 *
 * Mounted at: app.use('/api', feesRoutes)
 *
 * Resulting endpoints:
 *   /api/fee-types
 *   /api/fee-periods
 *   /api/utility-invoices
 */

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const feesController = require('../controllers/fees.controller');
const billingController = require('../controllers/billing.controller');

router.use(authenticate);

/* -------------------------------------------------------------------------- */
/* Fee Types                                                                  */
/* -------------------------------------------------------------------------- */

router.get('/fee-types', feesController.listFeeTypes);

router.post('/fee-types', feesController.createFeeType);

router.get('/fee-types/:id', feesController.getFeeType);

router.patch('/fee-types/:id', feesController.updateFeeType);

router.delete('/fee-types/:id', feesController.deactivateFeeType);

/* -------------------------------------------------------------------------- */
/* Fee Type Price History                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  '/fee-types/:id/price-history',
  feesController.listFeeTypePriceHistory
);

router.post(
  '/fee-types/:id/price-history',
  feesController.createFeeTypePriceVersion
);

/* -------------------------------------------------------------------------- */
/* Fee Periods                                                                */
/* -------------------------------------------------------------------------- */

router.get('/fee-periods', feesController.listFeePeriods);

router.post('/fee-periods', feesController.createFeePeriod);

router.get('/fee-periods/:id', feesController.getFeePeriod);

router.patch('/fee-periods/:id', feesController.updateFeePeriod);

router.post('/fee-periods/:id/activate', feesController.activateFeePeriod);

router.post(
  '/fee-periods/:id/generate-invoices',
  authorize({ permission: 'invoices:write' }),
  billingController.generateInvoicesForFeePeriod
);

router.delete('/fee-periods/:id', feesController.deleteDraftFeePeriod);

/* -------------------------------------------------------------------------- */
/* Utility Invoices                                                           */
/* -------------------------------------------------------------------------- */

router.get('/utility-invoices', feesController.listUtilityInvoices);

router.post('/utility-invoices', feesController.createUtilityInvoice);

router.patch('/utility-invoices/:id', feesController.updateUtilityInvoice);

router.post('/utility-invoices/:id/confirm', feesController.confirmUtilityInvoice);

router.delete('/utility-invoices/:id', feesController.deleteDraftUtilityInvoice);

module.exports = router;
