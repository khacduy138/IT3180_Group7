const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize({ permission: 'users:read' }),
  (req, res) => res.json({ success: true, data: [], message: 'Get users - to be implemented' })
);

router.post(
  '/',
  authorize({ permission: 'users:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Create user - to be implemented' })
);

router.put(
  '/:id',
  authorize({ permission: 'users:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Update user - to be implemented' })
);

router.delete(
  '/:id',
  authorize({ permission: 'users:write' }),
  (req, res) => res.status(501).json({ success: false, message: 'Deactivate user - to be implemented' })
);

module.exports = router;
