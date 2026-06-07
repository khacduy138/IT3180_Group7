'use strict';

const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const demographicChangeController = require('../controllers/demographicChange.controller');

const router = express.Router();

router.use(authenticate);

router.post(
  '/:id/absence',
  authorize({ permission: 'residents:write' }),
  demographicChangeController.createAbsence,
);

router.post(
  '/:id/temporary-residence',
  authorize({ permission: 'residents:write' }),
  demographicChangeController.createTemporaryResidence,
);

router.post(
  '/:id/transfer',
  authorize({ permission: 'residents:write' }),
  demographicChangeController.createTransfer,
);

module.exports = router;
