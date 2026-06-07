'use strict';

const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const householdController = require('../controllers/household.controller');

const router = express.Router();

router.use(authenticate);

/* ── Households ─────────────────────────────────────────────── */

router.get(
  '/',
  authorize({ permission: 'households:read' }),
  householdController.listHouseholds,
);

router.post(
  '/',
  authorize({ permission: 'households:write' }),
  householdController.createHousehold,
);

router.get(
  '/:id',
  authorize({ permission: 'households:read' }),
  householdController.getHousehold,
);

router.put(
  '/:id',
  authorize({ permission: 'households:write' }),
  householdController.updateHousehold,
);

router.delete(
  '/:id',
  authorize({ permission: 'households:write' }),
  householdController.deleteHousehold,
);

/* ── Residents ──────────────────────────────────────────────── */

router.get(
  '/:id/residents',
  authorize({ permission: 'residents:read' }),
  householdController.listResidents,
);

router.post(
  '/:id/residents',
  authorize({ permission: 'residents:write' }),
  householdController.addResident,
);

router.put(
  '/:id/residents/:residentId',
  authorize({ permission: 'residents:write' }),
  householdController.updateResident,
);

router.delete(
  '/:id/residents/:residentId',
  authorize({ permission: 'residents:write' }),
  householdController.removeResident,
);

/* ── Vehicles ───────────────────────────────────────────────── */

router.get(
  '/:id/vehicles',
  authorize({ permission: 'households:read' }),
  householdController.listVehicles,
);

router.post(
  '/:id/vehicles',
  authorize({ permission: 'households:write' }),
  householdController.addVehicle,
);

router.delete(
  '/:id/vehicles/:vehicleId',
  authorize({ permission: 'households:write' }),
  householdController.removeVehicle,
);

module.exports = router;
