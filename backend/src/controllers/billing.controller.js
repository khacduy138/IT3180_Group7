const crypto = require('crypto');
const { Op } = require('sequelize');

const {
  sequelize,
  Household,
  Vehicle,
  FeePeriod,
  FeeType,
  PeriodFee,
  FeeUsage,
  Invoice,
  InvoiceItem,
  Payment,
} = require('../models');
const { buildInvoiceItems } = require('../services/invoiceGeneration');
const {
  STATUSES,
  canTransition,
  getNewStatus,
} = require('../utils/invoiceStateMachine');

const DEFAULT_PAGE_SIZE = 20;

const buildInvoiceNumber = (feePeriod, household) => {
  const suffix = crypto.randomInt(1000, 9999);
  return `INV-${feePeriod.code}-${household.room_number}-${suffix}`;
};

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

const listInvoices = async (req, res, next) => {
  try {
    const pageNumber = Math.max(Number(req.query.pageNumber || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(req.query.pageSize || DEFAULT_PAGE_SIZE), 1),
      100
    );

    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.householdId !== undefined) {
      const householdId = Number(req.query.householdId);
      if (!Number.isFinite(householdId)) {
        return sendError(res, 400, 'Invalid householdId', [
          { field: 'householdId', code: 'VAL_002', message: 'householdId must be a number' },
        ]);
      }

      where.household_id = householdId;
    }

    const periodFilter = req.query.feePeriodId ?? req.query.periodId;
    if (periodFilter !== undefined) {
      const feePeriodId = Number(periodFilter);
      if (!Number.isFinite(feePeriodId)) {
        return sendError(res, 400, 'Invalid feePeriodId', [
          { field: 'feePeriodId', code: 'VAL_002', message: 'feePeriodId must be a number' },
        ]);
      }

      where.fee_period_id = feePeriodId;
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: InvoiceItem, as: 'invoice_items' },
        { model: Payment, as: 'payments' },
        { model: Household, as: 'household' },
        { model: FeePeriod, as: 'fee_period' },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    });

    const totalPages = Math.ceil(count / pageSize);

    return sendSuccess(res, 200, 'Invoices retrieved successfully', rows, {
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

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(Number(req.params.id), {
      include: [
        { model: InvoiceItem, as: 'invoice_items' },
        { model: Payment, as: 'payments' },
        { model: Household, as: 'household' },
        { model: FeePeriod, as: 'fee_period' },
      ],
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    return sendSuccess(res, 200, 'Invoice retrieved successfully', invoice);
  } catch (error) {
    return next(error);
  }
};

const generateInvoicesForFeePeriod = async (req, res, next) => {
  try {
    const feePeriodId = Number(req.params.id);

    if (!Number.isInteger(feePeriodId) || feePeriodId <= 0) {
      return sendError(res, 400, 'Invalid fee period id', [
        { field: 'id', code: 'VAL_002', message: 'id must be a positive integer' },
      ]);
    }

    const feePeriod = await FeePeriod.findByPk(feePeriodId);
    if (!feePeriod) {
      return sendError(res, 404, 'Fee period not found');
    }

    const existingInvoiceCount = await Invoice.count({
      where: { fee_period_id: feePeriodId },
    });
    if (existingInvoiceCount > 0) {
      return sendError(res, 409, 'Invoices already exist for this fee period');
    }

    const [periodFees, households, feePeriodFeeTypes] = await Promise.all([
      PeriodFee.findAll({
        where: { fee_period_id: feePeriodId },
        include: [{ model: FeeType, as: 'fee_type', required: true }],
        order: [['id', 'ASC']],
      }),
      Household.findAll({
        where: {
          deleted_at: null,
          status: { [Op.in]: ['active', 'ACTIVE'] },
        },
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            where: { is_active: true },
            required: false,
          },
        ],
        order: [['id', 'ASC']],
      }),
      sequelize.query(
        `SELECT pfft.fee_type_id, ph.unit_price as snapshot_price
         FROM fee_period_fee_types pfft
         LEFT JOIN fee_type_price_history ph ON ph.id = pfft.price_history_id
         WHERE pfft.fee_period_id = :feePeriodId`,
        { replacements: { feePeriodId }, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const snapshotByFeeTypeId = new Map(
      feePeriodFeeTypes.map((r) => [Number(r.fee_type_id), Number(r.snapshot_price)])
    );

    const periodFeeIds = periodFees.map((pf) => pf.id);
    const feeUsages = periodFeeIds.length
      ? await FeeUsage.findAll({
          where: { period_fee_id: periodFeeIds },
          order: [['id', 'ASC']],
        })
      : [];
    const usagesByHousehold = new Map();

    for (const usage of feeUsages) {
      const householdUsages = usagesByHousehold.get(usage.household_id) || [];
      householdUsages.push(usage.get({ plain: true }));
      usagesByHousehold.set(usage.household_id, householdUsages);
    }

    const normalizedPeriodFees = periodFees.map((periodFee) => {
      const plain = periodFee.get({ plain: true });
      const snapshotPrice = snapshotByFeeTypeId.get(Number(plain.fee_type_id));
      if (snapshotPrice !== undefined && plain.fee_type) {
        plain.fee_type = { ...plain.fee_type, unit_price: snapshotPrice };
      }
      return plain;
    });
    const createdInvoiceIds = [];
    const failed = [];
    const dueDate = req.body?.dueDate || feePeriod.end_date || null;

    for (const householdModel of households) {
      const household = householdModel.get({ plain: true });
      const transaction = await sequelize.transaction();

      try {
        const { items, totalAmount } = buildInvoiceItems({
          household,
          periodFees: normalizedPeriodFees,
          feeUsages: usagesByHousehold.get(household.id) || [],
          vehicles: household.vehicles || [],
        });

        const invoice = await Invoice.create(
          {
            uuid: crypto.randomUUID(),
            invoice_number: buildInvoiceNumber(feePeriod, household),
            household_id: household.id,
            fee_period_id: feePeriod.id,
            total_amount: totalAmount,
            paid_amount: 0,
            status: 'PENDING',
            due_date: dueDate,
            created_by: req.user.id,
          },
          { transaction }
        );

        if (items.length) {
          await InvoiceItem.bulkCreate(
            items.map((item) => ({ ...item, invoice_id: invoice.id })),
            { transaction }
          );
        }

        await transaction.commit();
        createdInvoiceIds.push(invoice.id);
      } catch (error) {
        await transaction.rollback();
        failed.push({
          householdId: household.id,
          reason: error.name === 'SequelizeUniqueConstraintError'
            ? 'INVOICE_ALREADY_EXISTS'
            : error.message,
        });
      }
    }

    return sendSuccess(res, 201, 'Invoice generation completed', {
      feePeriodId,
      requestedHouseholds: households.length,
      createdCount: createdInvoiceIds.length,
      skippedCount: 0,
      failedCount: failed.length,
      createdInvoiceIds,
      skipped: [],
      failed,
    });
  } catch (error) {
    return next(error);
  }
};

const createInvoice = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { householdId, feePeriodId, dueDate, createdBy, items = [] } = req.body;

    const errors = [];

    if (!householdId) {
      errors.push({ field: 'householdId', code: 'VAL_001', message: 'householdId is required' });
    }

    if (!feePeriodId) {
      errors.push({ field: 'feePeriodId', code: 'VAL_001', message: 'feePeriodId is required' });
    }

    if (!createdBy) {
      errors.push({ field: 'createdBy', code: 'VAL_001', message: 'createdBy is required' });
    }

    if (errors.length) {
      await transaction.rollback();
      return sendError(res, 400, 'Missing required fields', errors);
    }

    const household = await Household.findByPk(Number(householdId));
    if (!household) {
      await transaction.rollback();
      return sendError(res, 404, 'Household not found');
    }

    const feePeriod = await FeePeriod.findByPk(Number(feePeriodId));
    if (!feePeriod) {
      await transaction.rollback();
      return sendError(res, 404, 'Fee period not found');
    }

    const invoiceNumber = buildInvoiceNumber(feePeriod, household);

    const createdById = Number(createdBy);
    if (!Number.isInteger(createdById)) {
      await transaction.rollback();
      return sendError(res, 400, 'Invalid createdBy', [
        { field: 'createdBy', code: 'VAL_002', message: 'createdBy must be an integer' },
      ]);
    }

    const existingInvoice = await Invoice.findOne({
      where: { household_id: household.id, fee_period_id: feePeriod.id },
      transaction,
    });

    if (existingInvoice) {
      await transaction.rollback();
      return sendError(res, 409, 'Invoice already exists for this household and fee period');
    }

    const invoice = await Invoice.create(
      {
        uuid: crypto.randomUUID(),
        invoice_number: invoiceNumber,
        household_id: household.id,
        fee_period_id: feePeriod.id,
        total_amount: 0,
        status: 'PENDING',
        due_date: dueDate || null,
        created_by: createdById,
      },
      { transaction }
    );

    let totalAmount = 0;

    if (items.length) {
      const feeTypeIds = items
        .map((item) => Number(item.feeTypeId))
        .filter((value) => Number.isFinite(value));

      const feeTypes = await FeeType.findAll({
        where: { id: feeTypeIds },
      });

      const feeTypeMap = new Map(feeTypes.map((feeType) => [feeType.id, feeType]));

      for (const item of items) {
        const feeTypeId = Number(item.feeTypeId);
        const quantity = Number(item.quantity || 0);
        const priceSnapshot = Number(item.priceSnapshot || 0);
        const source = item.source || 'MANUAL_INPUT';

        if (!feeTypeMap.has(feeTypeId)) {
          await transaction.rollback();
          return sendError(res, 400, 'Invalid fee type in items', [
            {
              field: 'feeTypeId',
              code: 'VAL_004',
              message: `Fee type ${feeTypeId} not found`,
            },
          ]);
        }

        if (!Number.isFinite(quantity) || !Number.isFinite(priceSnapshot) || quantity <= 0 || priceSnapshot < 0) {
          await transaction.rollback();
          return sendError(res, 400, 'Invalid item values', [
            {
              field: 'items',
              code: 'VAL_002',
              message: 'Quantity must be a finite number > 0 and priceSnapshot must be a finite number >= 0',
            },
          ]);
        }

        const lineTotal = Number((quantity * priceSnapshot).toFixed(2));
        totalAmount += lineTotal;

        await InvoiceItem.create(
          {
            invoice_id: invoice.id,
            fee_type_id: feeTypeId,
            fee_usage_id: item.feeUsageId || null,
            vehicle_id: item.vehicleId || null,
            quantity,
            price_snapshot: priceSnapshot,
            line_total: lineTotal,
            source,
            description: item.description || null,
          },
          { transaction }
        );
      }
    }

    invoice.total_amount = totalAmount;
    await invoice.save({ transaction });

    await transaction.commit();

    const createdInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: InvoiceItem, as: 'invoice_items' },
        { model: Household, as: 'household' },
        { model: FeePeriod, as: 'fee_period' },
      ],
    });

    return sendSuccess(res, 201, 'Invoice created successfully', createdInvoice);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const invoiceId = Number(req.params.id);
    const { amount, paymentMethod, paymentDate, note, createdBy } = req.body;

    const errors = [];

    const amountNumber = Number(amount);
    const createdById = Number(createdBy ?? req.user?.id);
    const paymentDateValue = paymentDate ? new Date(paymentDate) : new Date();
    const paymentTimestamp = paymentDateValue.getTime();

    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      errors.push({ field: 'id', code: 'VAL_002', message: 'id must be a positive integer' });
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      errors.push({ field: 'amount', code: 'VAL_002', message: 'amount must be a finite number > 0' });
    }

    if (!paymentMethod) {
      errors.push({ field: 'paymentMethod', code: 'VAL_001', message: 'paymentMethod is required' });
    }

    if (Number.isNaN(paymentTimestamp)) {
      errors.push({ field: 'paymentDate', code: 'VAL_002', message: 'paymentDate must be a valid date' });
    }

    if (!Number.isInteger(createdById)) {
      errors.push({ field: 'createdBy', code: 'VAL_002', message: 'createdBy must be an integer' });
    }

    if (errors.length) {
      await transaction.rollback();
      return sendError(res, 400, 'Missing or invalid required fields', errors);
    }

    const invoice = await Invoice.findByPk(invoiceId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!invoice) {
      await transaction.rollback();
      return sendError(res, 404, 'Invoice not found');
    }

    if (invoice.status === STATUSES.PAID) {
      await transaction.rollback();
      return sendError(res, 409, 'Invoice is already fully paid');
    }

    const currentPaidAmount = Number(invoice.paid_amount || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const nextPaidAmount = Number((currentPaidAmount + amountNumber).toFixed(2));

    if (nextPaidAmount > totalAmount) {
      await transaction.rollback();
      return sendError(res, 400, 'Payment amount exceeds remaining invoice balance', [
        {
          field: 'amount',
          code: 'VAL_004',
          message: 'amount must not exceed remaining invoice balance',
        },
      ]);
    }

    const payment = await Payment.create(
      {
        invoice_id: invoice.id,
        amount: amountNumber,
        payment_method: paymentMethod,
        payment_date: paymentDateValue,
        note: note || null,
        created_by: createdById,
      },
      { transaction }
    );

    const newStatus = getNewStatus(totalAmount, nextPaidAmount);

    if (!canTransition(invoice.status, newStatus)) {
      await transaction.rollback();
      return sendError(res, 409, 'Invalid invoice status transition');
    }

    invoice.paid_amount = nextPaidAmount;
    invoice.status = newStatus;
    await invoice.save({ transaction });

    await transaction.commit();

    return sendSuccess(res, 201, 'Payment recorded successfully', {
      payment,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        household_id: invoice.household_id,
        total_amount: invoice.total_amount,
        paid_amount: invoice.paid_amount,
        status: invoice.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const listPayments = async (req, res, next) => {
  try {
    const where = {};

    if (req.query.invoiceId !== undefined && req.query.invoiceId !== '') {
      const invoiceId = Number(req.query.invoiceId);

      if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
        return sendError(res, 400, 'Invalid invoiceId', [
          { field: 'invoiceId', code: 'VAL_002', message: 'invoiceId must be a positive number' },
        ]);
      }

      where.invoice_id = invoiceId;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Invoice,
          as: 'invoice',
          include: [{ model: Household, as: 'household' }],
        },
      ],
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
    });

    return sendSuccess(res, 200, 'Payments retrieved successfully', payments);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listInvoices,
  getInvoice,
  generateInvoicesForFeePeriod,
  createInvoice,
  createPayment,
  listPayments,
};
