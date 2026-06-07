const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get(
  '/',
  authorize({ roles: ['admin'] }),
  usersController.listUsers
);

router.post(
  '/',
  authorize({ roles: ['admin'] }),
  (req, res) => res.status(501).json({ success: false, message: 'Create user - to be implemented' })
);

router.put(
  '/:id',
  authorize({ roles: ['admin'] }),
  (req, res) => res.status(501).json({ success: false, message: 'Update user - to be implemented' })
);

router.delete(
  '/:id',
  authorize({ roles: ['admin'] }),
  (req, res) => res.status(501).json({ success: false, message: 'Deactivate user - to be implemented' })
);

module.exports = router;
