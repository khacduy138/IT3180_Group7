const express = require('express');

const usersController = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize({ roles: ['admin'] }));

router.get(
  '/',
  authorize({ permissions: ['users:read'] }),
  usersController.listUsers,
);

router.post(
  '/',
  authorize({ permissions: ['users:create'] }),
  usersController.createUser,
);

router.put(
  '/:id',
  authorize({ permissions: ['users:update'] }),
  usersController.updateUser,
);

router.delete(
  '/:id',
  authorize({ permissions: ['users:delete'] }),
  usersController.deactivateUser,
);

module.exports = router;
