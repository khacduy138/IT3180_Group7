const crypto = require('crypto');

const {
  sequelize,
  Household,
  FeePeriod,
  FeeType,
  Invoice,
  InvoiceItem,
  Payment,
} = require('../models');

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

    if (req.query.feePeriodId !== undefined) {
      const feePeriodId = Number(req.query.feePeriodId);
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
        {
          model: InvoiceItem,
        },
        {
          model: Payment,
        },
        {
          model: Household,
        },
        {
          model: FeePeriod,
        },
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
        {
          model: InvoiceItem,
        },
        {
          model: Payment,
        },
        {
          model: Household,
        },
        {
          model: FeePeriod,
        },
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

const createInvoice = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { householdId, feePeriodId, dueDate, createdBy, items = [] } = req.body;

    if (!householdId || !feePeriodId || !createdBy) {
      await transaction.rollback();
      return sendError(res, 400, 'Missing required fields', [
        { field: 'householdId', code: 'VAL_001', message: 'householdId is required' },
        { field: 'feePeriodId', code: 'VAL_001', message: 'feePeriodId is required' },
        { field: 'createdBy', code: 'VAL_001', message: 'createdBy is required' },
      ]);
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

    const invoice = await Invoice.create(
      {
        uuid: crypto.randomUUID(),
        invoice_number: invoiceNumber,
        household_id: household.id,
        fee_period_id: feePeriod.id,
        total_amount: 0,
        status: 'PENDING',
        due_date: dueDate || null,
        created_by: Number(createdBy),
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

        if (quantity <= 0 || priceSnapshot < 0) {
          await transaction.rollback();
          return sendError(res, 400, 'Invalid item values', [
            {
              field: 'items',
              code: 'VAL_002',
              message: 'Quantity must be > 0 and priceSnapshot must be >= 0',
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
      include: [InvoiceItem, Household, FeePeriod],
    });

    return sendSuccess(res, 201, 'Invoice created successfully', createdInvoice);
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    const { amount, paymentMethod, paymentDate, note, createdBy } = req.body;

    if (!invoiceId || !amount || !paymentMethod || !paymentDate || !createdBy) {
      return sendError(res, 400, 'Missing required fields', [
        { field: 'amount', code: 'VAL_001', message: 'amount is required' },
        { field: 'paymentMethod', code: 'VAL_001', message: 'paymentMethod is required' },
        { field: 'paymentDate', code: 'VAL_001', message: 'paymentDate is required' },
        { field: 'createdBy', code: 'VAL_001', message: 'createdBy is required' },
      ]);
    }

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [Payment],
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    const payment = await Payment.create({
      invoice_id: invoice.id,
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date: paymentDate,
      note: note || null,
      created_by: Number(createdBy),
    });

    const totalPaid = invoice.Payments.reduce(
      (sum, current) => sum + Number(current.amount),
      0
    );

    const updatedPaid = totalPaid + Number(payment.amount);

    if (updatedPaid >= Number(invoice.total_amount)) {
      invoice.status = 'PAID';
    } else if (updatedPaid > 0) {
      invoice.status = 'PARTIAL';
    }

    await invoice.save();

    return sendSuccess(res, 201, 'Payment recorded successfully', payment);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  createPayment,
};
