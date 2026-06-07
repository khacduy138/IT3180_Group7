'use strict';

const { Op } = require('sequelize');
const { sequelize, Resident, Household, HouseholdMember, DemographicChange } = require('../models');

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

const createAbsence = async (req, res, next) => {
  try {
    const residentId = Number(req.params.id);
    const { startDate, endDate, destination, householdId } = req.body;
    const errors = [];

    if (!startDate) {
      errors.push({ field: 'startDate', code: 'VAL_001', message: 'startDate is required' });
    }

    if (!endDate) {
      errors.push({ field: 'endDate', code: 'VAL_001', message: 'endDate is required' });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'endDate', code: 'VAL_002', message: 'endDate must be after startDate' });
    }

    if (!destination || !destination.trim()) {
      errors.push({ field: 'destination', code: 'VAL_001', message: 'destination is required' });
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const resident = await Resident.findByPk(residentId);
    if (!resident) {
      return sendError(res, 404, 'Resident not found');
    }

    const member = householdId
      ? await HouseholdMember.findOne({ where: { resident_id: residentId, household_id: householdId } })
      : await HouseholdMember.findOne({ where: { resident_id: residentId, move_out_date: null } });

    if (!member) {
      return sendError(res, 404, 'Household membership not found for this resident');
    }

    const duplicate = await DemographicChange.findOne({
      where: {
        resident_id: residentId,
        household_id: member.household_id,
        change_type: 'absence',
        start_date: startDate,
      },
    });

    if (duplicate) {
      return sendError(res, 409, 'Duplicate absence record', [
        { field: 'startDate', code: 'VAL_002', message: 'An absence record with this start date already exists' },
      ]);
    }

    await member.update({ is_temporary_absent: true });

    const change = await DemographicChange.create({
      resident_id: residentId,
      household_id: member.household_id,
      change_type: 'absence',
      start_date: startDate,
      end_date: endDate,
      destination: destination.trim(),
      created_by: req.user?.id || null,
    });

    return sendSuccess(res, 201, 'Absence record created successfully', change);
  } catch (error) {
    return next(error);
  }
};

const createTemporaryResidence = async (req, res, next) => {
  try {
    const residentId = Number(req.params.id);
    const { originAddress, startDate, householdId } = req.body;
    const errors = [];

    if (!originAddress || !originAddress.trim()) {
      errors.push({ field: 'originAddress', code: 'VAL_001', message: 'originAddress is required' });
    }

    if (!startDate) {
      errors.push({ field: 'startDate', code: 'VAL_001', message: 'startDate is required' });
    }

    if (errors.length) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const resident = await Resident.findByPk(residentId);
    if (!resident) {
      return sendError(res, 404, 'Resident not found');
    }

    const member = householdId
      ? await HouseholdMember.findOne({ where: { resident_id: residentId, household_id: householdId } })
      : await HouseholdMember.findOne({ where: { resident_id: residentId, move_out_date: null } });

    if (!member) {
      return sendError(res, 404, 'Household membership not found for this resident');
    }

    const duplicate = await DemographicChange.findOne({
      where: {
        resident_id: residentId,
        household_id: member.household_id,
        change_type: 'temporary_residence',
        start_date: startDate,
      },
    });

    if (duplicate) {
      return sendError(res, 409, 'Duplicate temporary residence record', [
        { field: 'startDate', code: 'VAL_002', message: 'A temporary residence record with this start date already exists' },
      ]);
    }

    const change = await DemographicChange.create({
      resident_id: residentId,
      household_id: member.household_id,
      change_type: 'temporary_residence',
      start_date: startDate,
      origin_address: originAddress.trim(),
      created_by: req.user?.id || null,
    });

    return sendSuccess(res, 201, 'Temporary residence record created successfully', change);
  } catch (error) {
    return next(error);
  }
};

const createTransfer = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const residentId = Number(req.params.id);
    const { householdId, destination, note } = req.body;

    const resident = await Resident.findByPk(residentId, { transaction });
    if (!resident) {
      await transaction.rollback();
      return sendError(res, 404, 'Resident not found');
    }

    const member = householdId
      ? await HouseholdMember.findOne({
          where: { resident_id: residentId, household_id: householdId, move_out_date: null },
          transaction,
        })
      : await HouseholdMember.findOne({
          where: { resident_id: residentId, move_out_date: null },
          transaction,
        });

    if (!member) {
      await transaction.rollback();
      return sendError(res, 404, 'Active household membership not found for this resident');
    }

    const household = await Household.findOne({
      where: { id: member.household_id, deleted_at: null },
      transaction,
    });

    if (!household) {
      await transaction.rollback();
      return sendError(res, 404, 'Household not found');
    }

    const moveOutDate = new Date().toISOString().slice(0, 10);
    await member.update({ move_out_date: moveOutDate }, { transaction });

    const remainingMembers = await HouseholdMember.count({
      where: { household_id: member.household_id, move_out_date: null },
      transaction,
    });

    if (remainingMembers === 0) {
      await household.update({ status: 'inactive' }, { transaction });
    }

    const change = await DemographicChange.create(
      {
        resident_id: residentId,
        household_id: member.household_id,
        change_type: 'transfer',
        start_date: moveOutDate,
        destination: destination ? destination.trim() : null,
        note: note ? note.trim() : null,
        created_by: req.user?.id || null,
      },
      { transaction },
    );

    await transaction.commit();

    return sendSuccess(res, 201, 'Transfer record created successfully', change);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const listDemographicChanges = async (req, res, next) => {
  try {
    const { householdId, residentId, changeType } = req.query;
    const where = {};

    if (householdId) where.household_id = Number(householdId);
    if (residentId) where.resident_id = Number(residentId);
    if (changeType) where.change_type = changeType;

    const changes = await DemographicChange.findAll({
      where,
      include: [
        { model: Resident, as: 'resident', attributes: ['id', 'full_name', 'citizen_id'] },
        { model: Household, as: 'household', attributes: ['id', 'room_number'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return sendSuccess(res, 200, 'Demographic changes retrieved successfully', changes);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAbsence,
  createTemporaryResidence,
  createTransfer,
  listDemographicChanges,
};
