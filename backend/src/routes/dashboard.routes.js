const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get(
  '/summary',
  authorize({ permission: 'reports:read' }),
  (req, res) => res.status(501).json({ success: false, message: 'Dashboard summary - to be implemented' })
);

router.get(
  '/',
  authorize({ permission: 'reports:read' }),
  (req, res) => res.json({
    success: true,
    message: 'Dashboard - to be implemented',
    stats: { totalHouseholds: 0, totalFees: 0, totalBilling: 0 },
  })
);

module.exports = router;
