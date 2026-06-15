'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');

const {
  sequelize,
  Household,
  Resident,
  HouseholdMember,
  Vehicle,
} = require('../models');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/* ── Helpers ──────────────────────────────────────────────────── */

const sendSuccess = (res, statusCode, message, data, extra = {}) =>
  res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extra,
  });

const sendError = (res, statusCode, message, errors = []) =>
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });

function parsePage(query) {
  const pageNumber = Math.max(Number(query.pageNumber || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(query.pageSize || DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE,
  );
  return { pageNumber, pageSize };
}

/* ── Households ───────────────────────────────────────────────── */

const listHouseholds = async (req, res, next) => {
  try {
    const { pageNumber, pageSize } = parsePage(req.query);
    const where = { deleted_at: null };

    if (req.query.search) {
      where.room_number = { [Op.like]: `%${req.query.search}%` };
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    const { rows, count } = await Household.findAndCountAll({
      where,
      order: [['room_number', 'ASC']],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Households retrieved successfully', rows, {
      pagination: {
        pageNumber,
        pageSize,
        totalRecords: count,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getHousehold = async (req, res, next) => {
  try {
    const household = await Household.findOne({
      where: { id: Number(req.params.id), deleted_at: null },
      include: [
        {
          model: HouseholdMember,
          as: 'household_members',
          include: [{ model: Resident, as: 'resident' }],
        },
        { model: Vehicle, as: 'vehicles', where: { is_active: true }, required: false },
      ],
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    return sendSuccess(res, 200, 'Household retrieved successfully', household);
  } catch (error) {
    return next(error);
  }
};

const createHousehold = async (req, res, next) => {
  try {
    const roomNumber = req.body.roomNumber ?? req.body.room_number;
    const squareMeters = req.body.squareMeters ?? req.body.square_meters;
    const { status } = req.body;
    const errors = [];

    if (!roomNumber || typeof roomNumber !== 'string' || !roomNumber.trim()) {
      errors.push({ field: 'roomNumber', code: 'VAL_001', message: 'roomNumber is required' });
    }

    if (squareMeters === undefined || squareMeters === null) {
      errors.push({ field: 'squareMeters', code: 'VAL_001', message: 'squareMeters is required' });
    } else if (!Number.isFinite(Number(squareMeters)) || Number(squareMeters) <= 0) {
      errors.push({ field: 'squareMeters', code: 'VAL_002', message: 'squareMeters must be a positive number' });
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const existing = await Household.findOne({
      where: { room_number: roomNumber.trim(), deleted_at: null },
    });

    if (existing) {
      return sendError(res, 409, 'Room number already exists', [
        { field: 'roomNumber', code: 'VAL_002', message: `Room ${roomNumber} is already registered` },
      ]);
    }

    const household = await Household.create({
      uuid: crypto.randomUUID(),
      room_number: roomNumber.trim(),
      square_meters: Number(squareMeters),
      status: status || 'active',
    });

    return sendSuccess(res, 201, 'Household created successfully', household);
  } catch (error) {
    return next(error);
  }
};

const updateHousehold = async (req, res, next) => {
  try {
    const household = await Household.findOne({
      where: { id: Number(req.params.id), deleted_at: null },
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    const { roomNumber, squareMeters, status } = req.body;
    const updates = {};
    const errors = [];

    if (roomNumber !== undefined) {
      if (typeof roomNumber !== 'string' || !roomNumber.trim()) {
        errors.push({ field: 'roomNumber', code: 'VAL_002', message: 'roomNumber cannot be empty' });
      } else {
        const conflict = await Household.findOne({
          where: {
            room_number: roomNumber.trim(),
            deleted_at: null,
            id: { [Op.ne]: household.id },
          },
        });
        if (conflict) {
          return sendError(res, 409, 'Room number already exists', [
            { field: 'roomNumber', code: 'VAL_002', message: `Room ${roomNumber} is already registered` },
          ]);
        }
        updates.room_number = roomNumber.trim();
      }
    }

    if (squareMeters !== undefined) {
      if (!Number.isFinite(Number(squareMeters)) || Number(squareMeters) <= 0) {
        errors.push({ field: 'squareMeters', code: 'VAL_002', message: 'squareMeters must be a positive number' });
      } else {
        updates.square_meters = Number(squareMeters);
      }
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    await household.update(updates);

    return sendSuccess(res, 200, 'Household updated successfully', household);
  } catch (error) {
    return next(error);
  }
};

const deleteHousehold = async (req, res, next) => {
  try {
    const household = await Household.findOne({
      where: { id: Number(req.params.id), deleted_at: null },
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    await household.update({ deleted_at: new Date() });

    return sendSuccess(res, 200, 'Household deleted successfully', { id: household.id });
  } catch (error) {
    return next(error);
  }
};

/* ── Residents ────────────────────────────────────────────────── */

const listResidents = async (req, res, next) => {
  try {
    const household = await Household.findOne({
      where: { id: Number(req.params.id), deleted_at: null },
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    const { pageNumber, pageSize } = parsePage(req.query);

    const { rows, count } = await HouseholdMember.findAndCountAll({
      where: { household_id: household.id },
      include: [{ model: Resident, as: 'resident' }],
      order: [['move_in_date', 'DESC']],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Residents retrieved successfully', rows, {
      pagination: {
        pageNumber,
        pageSize,
        totalRecords: count,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const addResident = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const householdId = Number(req.params.id);
    const {
      fullName,
      gender,
      citizenId,
      dateOfBirth,
      phoneNumber,
      relationshipToHead,
      moveInDate,
    } = req.body;

    const household = await Household.findOne({
      where: { id: householdId, deleted_at: null },
      transaction,
    });

    if (!household) {
      await transaction.rollback();
      return sendError(res, 404, 'Household not found');
    }

    const errors = [];

    if (!fullName || !fullName.trim()) {
      errors.push({ field: 'fullName', code: 'VAL_001', message: 'fullName is required' });
    }

    if (!gender) {
      errors.push({ field: 'gender', code: 'VAL_001', message: 'gender is required' });
    }

    const resolvedMoveInDate = moveInDate || new Date().toISOString().slice(0, 10);

    if (errors.length) {
      await transaction.rollback();
      return sendError(res, 400, 'Validation failed', errors);
    }

    if (citizenId) {
      const duplicate = await Resident.findOne({ where: { citizen_id: citizenId }, transaction });
      if (duplicate) {
        await transaction.rollback();
        return sendError(res, 409, 'Citizen ID already registered', [
          { field: 'citizenId', code: 'VAL_002', message: `Citizen ID ${citizenId} already exists in the system` },
        ]);
      }
    }

    const resident = await Resident.create(
      {
        uuid: crypto.randomUUID(),
        full_name: fullName.trim(),
        gender,
        citizen_id: citizenId || null,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber || null,
      },
      { transaction },
    );

    const member = await HouseholdMember.create(
      {
        household_id: household.id,
        resident_id: resident.id,
        relationship_to_head: relationshipToHead || null,
        move_in_date: resolvedMoveInDate,
      },
      { transaction },
    );

    await transaction.commit();

    return sendSuccess(res, 201, 'Resident added to household successfully', {
      resident,
      membership: member,
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const updateResident = async (req, res, next) => {
  try {
    const resident = await Resident.findByPk(Number(req.params.residentId));

    if (!resident) {
      return sendError(res, 404, 'Resident not found');
    }

    const { fullName, gender, citizenId, dateOfBirth, phoneNumber } = req.body;
    const updates = {};
    const errors = [];

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        errors.push({ field: 'fullName', code: 'VAL_002', message: 'fullName cannot be empty' });
      } else {
        updates.full_name = fullName.trim();
      }
    }

    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth;
    if (phoneNumber !== undefined) updates.phone_number = phoneNumber;

    if (citizenId !== undefined) {
      if (citizenId !== resident.citizen_id) {
        const duplicate = await Resident.findOne({
          where: { citizen_id: citizenId, id: { [Op.ne]: resident.id } },
        });
        if (duplicate) {
          return sendError(res, 409, 'Citizen ID already registered', [
            { field: 'citizenId', code: 'VAL_002', message: `Citizen ID ${citizenId} already exists` },
          ]);
        }
      }
      updates.citizen_id = citizenId;
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    await resident.update(updates);

    return sendSuccess(res, 200, 'Resident updated successfully', resident);
  } catch (error) {
    return next(error);
  }
};

const removeResident = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const householdId = Number(req.params.id);
    const residentId = Number(req.params.residentId);

    const member = await HouseholdMember.findOne({
      where: { household_id: householdId, resident_id: residentId },
      transaction,
    });

    if (!member) {
      await transaction.rollback();
      return sendError(res, 404, 'Resident not found in this household');
    }

    const moveOutDate = req.body.moveOutDate || new Date().toISOString().slice(0, 10);
    await member.update({ move_out_date: moveOutDate }, { transaction });

    await transaction.commit();

    return sendSuccess(res, 200, 'Resident removed from household successfully', {
      householdId,
      residentId,
      moveOutDate,
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

/* ── Vehicles ─────────────────────────────────────────────────── */

const listVehicles = async (req, res, next) => {
  try {
    const household = await Household.findOne({
      where: { id: Number(req.params.id), deleted_at: null },
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    const vehicles = await Vehicle.findAll({
      where: { household_id: household.id, is_active: true },
      order: [['registered_at', 'DESC']],
    });

    return sendSuccess(res, 200, 'Vehicles retrieved successfully', vehicles);
  } catch (error) {
    return next(error);
  }
};

const addVehicle = async (req, res, next) => {
  try {
    const householdId = Number(req.params.id);
    const { licensePlate, vehicleType, registeredAt } = req.body;

    const household = await Household.findOne({
      where: { id: householdId, deleted_at: null },
    });

    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    const errors = [];

    if (!licensePlate || !licensePlate.trim()) {
      errors.push({ field: 'licensePlate', code: 'VAL_001', message: 'licensePlate is required' });
    }

    if (!vehicleType) {
      errors.push({ field: 'vehicleType', code: 'VAL_001', message: 'vehicleType is required' });
    }

    if (!registeredAt) {
      errors.push({ field: 'registeredAt', code: 'VAL_001', message: 'registeredAt is required' });
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const existing = await Vehicle.findOne({
      where: { license_plate: licensePlate.trim() },
    });

    if (existing) {
      return sendError(res, 409, 'License plate already registered', [
        { field: 'licensePlate', code: 'VAL_002', message: `License plate ${licensePlate} already exists` },
      ]);
    }

    const vehicle = await Vehicle.create({
      household_id: household.id,
      license_plate: licensePlate.trim().toUpperCase(),
      vehicle_type: vehicleType,
      registered_at: registeredAt,
    });

    return sendSuccess(res, 201, 'Vehicle added successfully', vehicle);
  } catch (error) {
    return next(error);
  }
};

const removeVehicle = async (req, res, next) => {
  try {
    const householdId = Number(req.params.id);
    const vehicleId = Number(req.params.vehicleId);

    const vehicle = await Vehicle.findOne({
      where: { id: vehicleId, household_id: householdId, is_active: true },
    });

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found in this household');
    }

    await vehicle.update({
      is_active: false,
      removed_at: new Date().toISOString().slice(0, 10),
    });

    return sendSuccess(res, 200, 'Vehicle removed successfully', { id: vehicle.id });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHouseholds,
  getHousehold,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  listResidents,
  addResident,
  updateResident,
  removeResident,
  listVehicles,
  addVehicle,
  removeVehicle,
};
