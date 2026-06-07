'use strict';

const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const demographicChangeController = require('../controllers/demographicChange.controller');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize({ permission: 'households:read' }),
  demographicChangeController.listDemographicChanges,
);

module.exports = router;
