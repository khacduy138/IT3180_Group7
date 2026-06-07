const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

/* ── Households ─────────────────────────────────────────────── */

router.get(
  '/',
  authorize({ permission: 'households:read' }),
  (req, res) => res.json({ success: true, data: [], message: 'Get households - to be implemented' })
);

router.post(
  '/',
  authorize({ permission: 'households:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Create household - to be implemented' })
);

router.get(
  '/:id',
  authorize({ permission: 'households:read' }),
  (req, res) => res.status(501).json({ success: false, message: 'Get household detail - to be implemented' })
);

router.put(
  '/:id',
  authorize({ permission: 'households:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Update household - to be implemented' })
);

router.delete(
  '/:id',
  authorize({ permission: 'households:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Delete household - to be implemented' })
);

/* ── Residents ──────────────────────────────────────────────── */

router.get(
  '/:id/residents',
  authorize({ permission: 'residents:read' }),
  (req, res) => res.status(501).json({ success: false, message: 'Get residents - to be implemented' })
);

router.post(
  '/:id/residents',
  authorize({ permission: 'residents:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Create resident - to be implemented' })
);

/* ── Vehicles ───────────────────────────────────────────────── */

router.get(
  '/:id/vehicles',
  authorize({ permission: 'households:read' }),
  (req, res) => res.status(501).json({ success: false, message: 'Get vehicles - to be implemented' })
);

router.post(
  '/:id/vehicles',
  authorize({ permission: 'households:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Create vehicle - to be implemented' })
);

module.exports = router;
