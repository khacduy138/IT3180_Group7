const Decimal = require('decimal.js');
const {
  sequelize,
  FeeType,
  FeeTypePriceHistory,
  FeePeriod,
  PeriodFee,
  UtilityInvoice,
  InvoiceItem,
  Household,
} = require('../models');

const VALID_CALCULATION_TYPES = ['per_area', 'per_vehicle', 'per_person', 'fixed', 'utility'];

const DEFAULT_PAGE_SIZE = 20;

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

const getPagination = (query) => {
  const pageNumber = Math.max(Number(query.pageNumber || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(query.pageSize || DEFAULT_PAGE_SIZE), 1),
    100
  );

  return {
    pageNumber,
    pageSize,
    offset: (pageNumber - 1) * pageSize,
  };
};

const listFeeTypes = async (req, res, next) => {
  try {
    const { pageNumber, pageSize, offset } = getPagination(req.query);

    const where = {};

    if (req.query.isActive !== undefined) {
      where.is_active = req.query.isActive === 'true';
    }

    if (req.query.calculationType) {
      where.calculation_type = req.query.calculationType;
    }

    const { rows, count } = await FeeType.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Fee types retrieved successfully', rows, {
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

const createFeeType = async (req, res, next) => {
  try {
    const {
      code,
      name,
      calculationType,
      unit,
      unitPrice,
      isMandatory = true,
      invoiceGenerationMode,
      vehicleType,
    } = req.body;

    const errors = [];

    if (!code) {
      errors.push({ field: 'code', code: 'VAL_001', message: 'code is required' });
    }

    if (!name) {
      errors.push({ field: 'name', code: 'VAL_001', message: 'name is required' });
    }

    if (!calculationType) {
      errors.push({ field: 'calculationType', code: 'VAL_001', message: 'calculationType is required' });
    } else if (!VALID_CALCULATION_TYPES.includes(calculationType)) {
      errors.push({
        field: 'calculationType',
        code: 'VAL_002',
        message: `calculationType must be one of: ${VALID_CALCULATION_TYPES.join(', ')}`,
      });
    }

    if (!invoiceGenerationMode) {
      errors.push({ field: 'invoiceGenerationMode', code: 'VAL_001', message: 'invoiceGenerationMode is required' });
    }

    const unitPriceNumber = Number(unitPrice);

    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber <= 0) {
      errors.push({ field: 'unitPrice', code: 'VAL_002', message: 'unitPrice must be a finite number > 0' });
    }

    if (errors.length) {
      return sendError(res, 400, 'Missing or invalid required fields', errors);
    }

    const existingFeeType = await FeeType.findOne({ where: { code } });

    if (existingFeeType) {
      return sendError(res, 409, 'Fee type code already exists');
    }

    const feeType = await FeeType.create({
      code,
      name,
      calculation_type: calculationType,
      unit: unit || null,
      unit_price: unitPriceNumber,
      is_mandatory: Boolean(isMandatory),
      is_active: true,
      invoice_generation_mode: invoiceGenerationMode,
      vehicle_type: vehicleType || null,
    });

    return sendSuccess(res, 201, 'Fee type created successfully', feeType);
  } catch (error) {
    return next(error);
  }
};

const getFeeType = async (req, res, next) => {
  try {
    const feeType = await FeeType.findByPk(req.params.id, {
      include: [{ model: FeePeriod, as: 'fee_periods' }],
    });

    if (!feeType) {
      return sendError(res, 404, 'Fee type not found');
    }

    return sendSuccess(res, 200, 'Fee type retrieved successfully', feeType);
  } catch (error) {
    return next(error);
  }
};

const updateFeeType = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const feeType = await FeeType.findByPk(req.params.id, { transaction });

    if (!feeType) {
      await transaction.rollback();
      return sendError(res, 404, 'Fee type not found');
    }

    const {
      name,
      calculationType,
      unit,
      unitPrice,
      isMandatory,
      isActive,
      invoiceGenerationMode,
      vehicleType,
    } = req.body;

    if (name !== undefined) feeType.name = name;
    if (calculationType !== undefined) feeType.calculation_type = calculationType;
    if (unit !== undefined) feeType.unit = unit;
    if (unitPrice !== undefined) {
      const unitPriceNumber = Number(unitPrice);

      if (!Number.isFinite(unitPriceNumber) || unitPriceNumber <= 0) {
        await transaction.rollback();
        return sendError(res, 400, 'Invalid unitPrice', [
          { field: 'unitPrice', code: 'VAL_002', message: 'unitPrice must be a finite number > 0' },
        ]);
      }

      const oldPrice = Number(feeType.unit_price);

      if (unitPriceNumber !== oldPrice) {
        const today = new Date().toISOString().slice(0, 10);

        await FeeTypePriceHistory.update(
          { effective_to: today },
          {
            where: { fee_type_id: feeType.id, effective_to: null },
            transaction,
          }
        );

        await FeeTypePriceHistory.create(
          {
            fee_type_id: feeType.id,
            unit_price: unitPriceNumber,
            effective_from: today,
            effective_to: null,
            created_by: req.user?.id || null,
          },
          { transaction }
        );
      }

      feeType.unit_price = unitPriceNumber;
    }
    if (isMandatory !== undefined) feeType.is_mandatory = Boolean(isMandatory);
    if (isActive !== undefined) feeType.is_active = Boolean(isActive);
    if (invoiceGenerationMode !== undefined) feeType.invoice_generation_mode = invoiceGenerationMode;
    if (vehicleType !== undefined) feeType.vehicle_type = vehicleType;

    await feeType.save({ transaction });
    await transaction.commit();

    return sendSuccess(res, 200, 'Fee type updated successfully', feeType);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const deactivateFeeType = async (req, res, next) => {
  try {
    const feeType = await FeeType.findByPk(req.params.id);

    if (!feeType) {
      return sendError(res, 404, 'Fee type not found');
    }

    const invoiceItemCount = await InvoiceItem.count({
      where: { fee_type_id: feeType.id },
    });

    if (invoiceItemCount > 0) {
      return sendError(
        res,
        409,
        'Cannot delete fee type that has associated invoices',
        [{ field: 'id', code: 'CONFLICT_001', message: `Fee type is used in ${invoiceItemCount} invoice item(s)` }]
      );
    }

    feeType.is_active = false;
    await feeType.save();

    return sendSuccess(res, 200, 'Fee type deactivated successfully', feeType);
  } catch (error) {
    return next(error);
  }
};

const listFeePeriods = async (req, res, next) => {
  try {
    const { pageNumber, pageSize, offset } = getPagination(req.query);

    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.year !== undefined) {
      const year = Number(req.query.year);

      if (!Number.isInteger(year)) {
        return sendError(res, 400, 'Invalid year', [
          { field: 'year', code: 'VAL_002', message: 'year must be an integer' },
        ]);
      }

      where.year = year;
    }

    const { rows, count } = await FeePeriod.findAndCountAll({
      where,
      distinct: true,
      include: [{ model: FeeType, as: 'fee_types' }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Fee periods retrieved successfully', rows, {
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

const createFeePeriod = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      code,
      name,
      periodType,
      month,
      year,
      startDate,
      endDate,
      status = 'DRAFT',
      feeTypeIds = [],
    } = req.body;

    const errors = [];

    if (!code) errors.push({ field: 'code', code: 'VAL_001', message: 'code is required' });
    if (!name) errors.push({ field: 'name', code: 'VAL_001', message: 'name is required' });
    if (!periodType) errors.push({ field: 'periodType', code: 'VAL_001', message: 'periodType is required' });
    if (!year) errors.push({ field: 'year', code: 'VAL_001', message: 'year is required' });
    if (!startDate) errors.push({ field: 'startDate', code: 'VAL_001', message: 'startDate is required' });
    if (!endDate) errors.push({ field: 'endDate', code: 'VAL_001', message: 'endDate is required' });

    const yearNumber = Number(year);
    const monthNumber = month === undefined || month === null ? null : Number(month);

    if (!Number.isInteger(yearNumber)) {
      errors.push({ field: 'year', code: 'VAL_002', message: 'year must be an integer' });
    }

    if (monthNumber !== null && !Number.isInteger(monthNumber)) {
      errors.push({ field: 'month', code: 'VAL_002', message: 'month must be an integer' });
    }

    if (errors.length) {
      await transaction.rollback();
      return sendError(res, 400, 'Missing or invalid required fields', errors);
    }

    const existingFeePeriod = await FeePeriod.findOne({
      where: { code },
      transaction,
    });

    if (existingFeePeriod) {
      await transaction.rollback();
      return sendError(res, 409, 'Fee period code already exists');
    }

    const feePeriod = await FeePeriod.create(
      {
        code,
        name,
        period_type: periodType,
        month: monthNumber,
        year: yearNumber,
        start_date: startDate,
        end_date: endDate,
        status,
      },
      { transaction }
    );

    if (feeTypeIds.length) {
      const periodFees = feeTypeIds.map((feeTypeId) => ({
        fee_period_id: feePeriod.id,
        fee_type_id: feeTypeId,
      }));

      await PeriodFee.bulkCreate(periodFees, { transaction });
    }

    await transaction.commit();

    const createdFeePeriod = await FeePeriod.findByPk(feePeriod.id, {
      include: [{ model: FeeType, as: 'fee_types' }],
    });

    return sendSuccess(res, 201, 'Fee period created successfully', createdFeePeriod);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const getFeePeriod = async (req, res, next) => {
  try {
    const feePeriod = await FeePeriod.findByPk(req.params.id, {
      include: [{ model: FeeType, as: 'fee_types' }],
    });

    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    return sendSuccess(res, 200, 'Fee period retrieved successfully', feePeriod);
  } catch (error) {
    return next(error);
  }
};

const updateFeePeriod = async (req, res, next) => {
  try {
    const feePeriod = await FeePeriod.findByPk(req.params.id);

    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    const {
      name,
      periodType,
      month,
      year,
      startDate,
      endDate,
      status,
    } = req.body;

    if (name !== undefined) feePeriod.name = name;
    if (periodType !== undefined) feePeriod.period_type = periodType;
    if (month !== undefined) feePeriod.month = month;
    if (year !== undefined) feePeriod.year = year;
    if (startDate !== undefined) feePeriod.start_date = startDate;
    if (endDate !== undefined) feePeriod.end_date = endDate;
    if (status !== undefined) feePeriod.status = status;

    await feePeriod.save();

    return sendSuccess(res, 200, 'Fee period updated successfully', feePeriod);
  } catch (error) {
    return next(error);
  }
};

const activateFeePeriod = async (req, res, next) => {
  try {
    const feePeriod = await FeePeriod.findByPk(req.params.id);

    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    feePeriod.status = 'ACTIVE';
    await feePeriod.save();

    return sendSuccess(res, 200, 'Fee period activated successfully', feePeriod);
  } catch (error) {
    return next(error);
  }
};

const deleteDraftFeePeriod = async (req, res, next) => {
  try {
    const feePeriod = await FeePeriod.findByPk(req.params.id);

    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    if (feePeriod.status !== 'DRAFT') {
      return sendError(res, 409, 'Only draft fee periods can be deleted');
    }

    await PeriodFee.destroy({
      where: { fee_period_id: feePeriod.id },
    });

    await feePeriod.destroy();

    return sendSuccess(res, 200, 'Draft fee period deleted successfully', feePeriod);
  } catch (error) {
    return next(error);
  }
};

const listFeeTypePriceHistory = async (req, res, next) => {
  try {
    const feeType = await FeeType.findByPk(req.params.id);

    if (!feeType) {
      return sendError(res, 404, 'Fee type not found');
    }

    const priceHistory = await FeeTypePriceHistory.findAll({
      where: { fee_type_id: feeType.id },
      order: [['effective_from', 'DESC']],
    });

    return sendSuccess(
      res,
      200,
      'Fee type price history retrieved successfully',
      priceHistory
    );
  } catch (error) {
    return next(error);
  }
};

const createFeeTypePriceVersion = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const feeType = await FeeType.findByPk(req.params.id, { transaction });

    if (!feeType) {
      await transaction.rollback();
      return sendError(res, 404, 'Fee type not found');
    }

    const { unitPrice, effectiveFrom, createdBy } = req.body;
    const errors = [];

    const unitPriceNumber = Number(unitPrice);
    const createdById =
      createdBy === undefined || createdBy === null ? null : Number(createdBy);

    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber < 0) {
      errors.push({
        field: 'unitPrice',
        code: 'VAL_002',
        message: 'unitPrice must be a finite number >= 0',
      });
    }

    if (!effectiveFrom || Number.isNaN(Date.parse(effectiveFrom))) {
      errors.push({
        field: 'effectiveFrom',
        code: 'VAL_002',
        message: 'effectiveFrom must be a valid date',
      });
    }

    if (
      createdById !== null &&
      !Number.isInteger(createdById)
    ) {
      errors.push({
        field: 'createdBy',
        code: 'VAL_002',
        message: 'createdBy must be an integer',
      });
    }

    if (errors.length) {
      await transaction.rollback();
      return sendError(res, 400, 'Missing or invalid required fields', errors);
    }

    const existingVersion = await FeeTypePriceHistory.findOne({
      where: {
        fee_type_id: feeType.id,
        effective_from: effectiveFrom,
      },
      transaction,
    });

    if (existingVersion) {
      await transaction.rollback();
      return sendError(res, 409, 'Price version already exists for this effective date');
    }

    await FeeTypePriceHistory.update(
      { effective_to: effectiveFrom },
      {
        where: {
          fee_type_id: feeType.id,
          effective_to: null,
        },
        transaction,
      }
    );

    const priceVersion = await FeeTypePriceHistory.create(
      {
        fee_type_id: feeType.id,
        unit_price: unitPriceNumber,
        effective_from: effectiveFrom,
        effective_to: null,
        created_by: createdById,
      },
      { transaction }
    );

    feeType.unit_price = unitPriceNumber;
    await feeType.save({ transaction });

    await transaction.commit();

    return sendSuccess(
      res,
      201,
      'Fee type price version created successfully',
      priceVersion
    );
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const calculateUtilityAmount = ({
  previousReading,
  currentReading,
  usageAmount,
  unitPrice,
}) => {
  const unitPriceDecimal = new Decimal(String(unitPrice || 0));
  let usageDecimal;

  if (
    Number.isFinite(Number(previousReading)) &&
    Number.isFinite(Number(currentReading))
  ) {
    usageDecimal = new Decimal(String(currentReading)).minus(new Decimal(String(previousReading)));
  } else {
    usageDecimal = new Decimal(String(usageAmount || 0));
  }

  const totalDecimal = usageDecimal.times(unitPriceDecimal).toDecimalPlaces(2);

  return {
    usageAmountNumber: usageDecimal.toNumber(),
    unitPriceNumber: unitPriceDecimal.toNumber(),
    totalAmount: totalDecimal.toNumber(),
  };
};

const listUtilityInvoices = async (req, res, next) => {
  try {
    const { pageNumber, pageSize, offset } = getPagination(req.query);

    const where = {};

    if (req.query.feePeriodId !== undefined) {
      where.fee_period_id = req.query.feePeriodId;
    }

    if (req.query.householdId !== undefined) {
      where.household_id = req.query.householdId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.utilityType) {
      where.utility_type = req.query.utilityType;
    }

    const { rows, count } = await UtilityInvoice.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: FeePeriod, as: 'fee_period' },
        { model: Household, as: 'household' },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Utility invoices retrieved successfully', rows, {
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

const createUtilityInvoice = async (req, res, next) => {
  try {
    const {
      feePeriodId,
      householdId,
      utilityType,
      previousReading,
      currentReading,
      usageAmount,
      unitPrice,
    } = req.body;

    const errors = [];

    if (!feePeriodId) {
      errors.push({ field: 'feePeriodId', code: 'VAL_001', message: 'feePeriodId is required' });
    }

    if (!householdId) {
      errors.push({ field: 'householdId', code: 'VAL_001', message: 'householdId is required' });
    }

    if (!utilityType) {
      errors.push({ field: 'utilityType', code: 'VAL_001', message: 'utilityType is required' });
    }

    if (unitPrice === undefined) {
      errors.push({ field: 'unitPrice', code: 'VAL_001', message: 'unitPrice is required' });
    }

    const { usageAmountNumber, unitPriceNumber, totalAmount } =
      calculateUtilityAmount({
        previousReading,
        currentReading,
        usageAmount,
        unitPrice,
      });

    if (!Number.isFinite(usageAmountNumber) || usageAmountNumber < 0) {
      errors.push({
        field: 'usageAmount',
        code: 'VAL_002',
        message: 'usageAmount must be a finite number >= 0',
      });
    }

    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber < 0) {
      errors.push({
        field: 'unitPrice',
        code: 'VAL_002',
        message: 'unitPrice must be a finite number >= 0',
      });
    }

    if (errors.length) {
      return sendError(res, 400, 'Missing or invalid required fields', errors);
    }

    const feePeriod = await FeePeriod.findByPk(feePeriodId);
    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    if (feePeriod.status !== 'ACTIVE') {
      return sendError(res, 422, 'Fee period must be active to record utility invoices', [
        { field: 'feePeriodId', code: 'VAL_003', message: 'Fee period is not active' },
      ]);
    }

    const household = await Household.findByPk(householdId);
    if (!household) {
      return sendError(res, 404, 'Household not found');
    }

    if (household.deleted_at !== null) {
      return sendError(res, 404, 'Household not found');
    }

    const existingUtilityInvoice = await UtilityInvoice.findOne({
      where: {
        fee_period_id: feePeriodId,
        household_id: householdId,
        utility_type: utilityType,
      },
    });

    if (existingUtilityInvoice) {
      return sendError(
        res,
        409,
        'Utility invoice already exists for this household, fee period, and utility type'
      );
    }

    const utilityInvoice = await UtilityInvoice.create({
      fee_period_id: feePeriodId,
      household_id: householdId,
      utility_type: utilityType,
      previous_reading: previousReading || null,
      current_reading: currentReading || null,
      usage_amount: usageAmountNumber,
      unit_price: unitPriceNumber,
      total_amount: totalAmount,
      status: 'draft',
    });

    return sendSuccess(
      res,
      201,
      'Utility invoice created successfully',
      utilityInvoice
    );
  } catch (error) {
    return next(error);
  }
};

const updateUtilityInvoice = async (req, res, next) => {
  try {
    const utilityInvoice = await UtilityInvoice.findByPk(req.params.id);

    if (!utilityInvoice) {
      return sendError(res, 404, 'Utility invoice not found');
    }

    if (utilityInvoice.status !== 'draft') {
      return sendError(res, 409, 'Only draft utility invoices can be updated');
    }

    const previousReading =
      req.body.previousReading !== undefined
        ? req.body.previousReading
        : utilityInvoice.previous_reading;
    const currentReading =
      req.body.currentReading !== undefined
        ? req.body.currentReading
        : utilityInvoice.current_reading;
    const usageAmount =
      req.body.usageAmount !== undefined
        ? req.body.usageAmount
        : utilityInvoice.usage_amount;
    const unitPrice =
      req.body.unitPrice !== undefined
        ? req.body.unitPrice
        : utilityInvoice.unit_price;

    const { usageAmountNumber, unitPriceNumber, totalAmount } =
      calculateUtilityAmount({
        previousReading,
        currentReading,
        usageAmount,
        unitPrice,
      });

    if (!Number.isFinite(usageAmountNumber) || usageAmountNumber < 0) {
      return sendError(res, 400, 'Invalid usageAmount', [
        {
          field: 'usageAmount',
          code: 'VAL_002',
          message: 'usageAmount must be a finite number >= 0',
        },
      ]);
    }

    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber < 0) {
      return sendError(res, 400, 'Invalid unitPrice', [
        {
          field: 'unitPrice',
          code: 'VAL_002',
          message: 'unitPrice must be a finite number >= 0',
        },
      ]);
    }

    if (req.body.utilityType !== undefined) {
      utilityInvoice.utility_type = req.body.utilityType;
    }

    utilityInvoice.previous_reading = previousReading || null;
    utilityInvoice.current_reading = currentReading || null;
    utilityInvoice.usage_amount = usageAmountNumber;
    utilityInvoice.unit_price = unitPriceNumber;
    utilityInvoice.total_amount = totalAmount;

    await utilityInvoice.save();

    return sendSuccess(
      res,
      200,
      'Utility invoice updated successfully',
      utilityInvoice
    );
  } catch (error) {
    return next(error);
  }
};

const confirmUtilityInvoice = async (req, res, next) => {
  try {
    const utilityInvoice = await UtilityInvoice.findByPk(req.params.id);

    if (!utilityInvoice) {
      return sendError(res, 404, 'Utility invoice not found');
    }

    utilityInvoice.status = 'confirmed';
    await utilityInvoice.save();

    return sendSuccess(
      res,
      200,
      'Utility invoice confirmed successfully',
      utilityInvoice
    );
  } catch (error) {
    return next(error);
  }
};

const deleteDraftUtilityInvoice = async (req, res, next) => {
  try {
    const utilityInvoice = await UtilityInvoice.findByPk(req.params.id);

    if (!utilityInvoice) {
      return sendError(res, 404, 'Utility invoice not found');
    }

    if (utilityInvoice.status !== 'draft') {
      return sendError(res, 409, 'Only draft utility invoices can be deleted');
    }

    await utilityInvoice.destroy();

    return sendSuccess(
      res,
      200,
      'Draft utility invoice deleted successfully',
      utilityInvoice
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listFeeTypes,
  createFeeType,
  getFeeType,
  updateFeeType,
  deactivateFeeType,
  listFeeTypePriceHistory,
  createFeeTypePriceVersion,
  listFeePeriods,
  createFeePeriod,
  getFeePeriod,
  updateFeePeriod,
  activateFeePeriod,
  deleteDraftFeePeriod,
  listUtilityInvoices,
  createUtilityInvoice,
  updateUtilityInvoice,
  confirmUtilityInvoice,
  deleteDraftUtilityInvoice,
};
