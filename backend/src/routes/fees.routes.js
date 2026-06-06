'use strict';

const express = require('express');

const router = express.Router();

/*
 * Module 3 — Fee Management Routes
 *
 * Planned mounting:
 *   app.use('/api', feesRoutes);
 *
 * Resulting endpoints:
 *   /api/fee-types
 *   /api/fee-periods
 *   /api/utility-invoices
 *
 * Authentication integration:
 *   Uncomment router.use(authenticate) after Tuấn completes
 *   src/middleware/authenticate.js.
 */

const authenticate = require('../middleware/authenticate');
router.use(authenticate);

function notImplemented(resource, action) {
  return (req, res) => {
    res.status(501).json({
      success: false,
      message: `${action} ${resource} - to be implemented`,
    });
  };
}

/* -------------------------------------------------------------------------- */
/* Fee Types                                                                  */
/* -------------------------------------------------------------------------- */

router.get(
  '/fee-types',
  notImplemented('fee types', 'Get')
);

router.post(
  '/fee-types',
  notImplemented('fee type', 'Create')
);

router.get(
  '/fee-types/:id',
  notImplemented('fee type detail', 'Get')
);

router.patch(
  '/fee-types/:id',
  notImplemented('fee type', 'Update')
);

router.delete(
  '/fee-types/:id',
  notImplemented('fee type', 'Deactivate')
);

/* -------------------------------------------------------------------------- */
/* Fee Type Price History                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  '/fee-types/:id/price-history',
  notImplemented('fee type price history', 'Get')
);

router.post(
  '/fee-types/:id/price-history',
  notImplemented('fee type price version', 'Create')
);

/* -------------------------------------------------------------------------- */
/* Fee Periods                                                                */
/* -------------------------------------------------------------------------- */

router.get(
  '/fee-periods',
  notImplemented('fee periods', 'Get')
);

router.post(
  '/fee-periods',
  notImplemented('fee period', 'Create')
);

router.get(
  '/fee-periods/:id',
  notImplemented('fee period detail', 'Get')
);

router.patch(
  '/fee-periods/:id',
  notImplemented('fee period', 'Update')
);

router.post(
  '/fee-periods/:id/activate',
  notImplemented('fee period', 'Activate')
);

router.delete(
  '/fee-periods/:id',
  notImplemented('draft fee period', 'Delete')
);

/* -------------------------------------------------------------------------- */
/* Utility Invoices                                                           */
/* -------------------------------------------------------------------------- */

router.get(
  '/utility-invoices',
  notImplemented('utility invoices', 'Get')
);

router.post(
  '/utility-invoices',
  notImplemented('utility invoice', 'Create')
);

router.patch(
  '/utility-invoices/:id',
  notImplemented('utility invoice', 'Update')
);

router.post(
  '/utility-invoices/:id/confirm',
  notImplemented('utility invoice', 'Confirm')
);

router.delete(
  '/utility-invoices/:id',
  notImplemented('draft utility invoice', 'Delete')
);

module.exports = router;