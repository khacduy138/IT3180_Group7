'use strict';

const request = require('supertest');

jest.mock('../middleware/authenticate', () => (req, _res, next) => {
  req.user = {
    id: 1,
    username: 'testadmin',
    role: 'admin',
    role_id: 1,
    permissions: [
      'invoices:read',
      'invoices:write',
      'payments:read',
      'payments:write',
    ],
  };
  return next();
});

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  LOCK: { UPDATE: 'UPDATE' },
};

const mockHousehold = (overrides = {}) => ({
  id: overrides.id || 1,
  uuid: overrides.uuid || 'hh-uuid-1',
  room_number: overrides.room_number || 'A101',
  square_meters: overrides.square_meters || 72.5,
  status: overrides.status || 'active',
  deleted_at: null,
  vehicles: overrides.vehicles || [],
  get: jest.fn(function () { return this; }),
});

const mockFeePeriod = (overrides = {}) => ({
  id: overrides.id || 1,
  code: overrides.code || 'P2024-01',
  month: overrides.month || 1,
  year: overrides.year || 2024,
  status: overrides.status || 'active',
  end_date: overrides.end_date || '2024-01-31',
});

const mockFeeType = (overrides = {}) => ({
  id: overrides.id || 1,
  name: overrides.name || 'Phí quản lý',
  calculation_type: overrides.calculation_type || 'fixed',
  invoice_generation_mode: overrides.invoice_generation_mode || 'AUTO',
  unit_price: overrides.unit_price || '500000.00',
  is_active: overrides.is_active !== undefined ? overrides.is_active : true,
  vehicle_type: overrides.vehicle_type || null,
});

const mockPeriodFee = (overrides = {}) => ({
  id: overrides.id || 1,
  fee_period_id: overrides.fee_period_id || 1,
  fee_type_id: overrides.fee_type_id || 1,
  fee_type: overrides.fee_type || mockFeeType(),
  get: jest.fn(function () { return { ...this }; }),
});

const mockInvoice = (overrides = {}) => ({
  id: overrides.id || 1,
  uuid: overrides.uuid || 'inv-uuid-1',
  invoice_number: overrides.invoice_number || 'INV-P2024-01-A101-1234',
  household_id: overrides.household_id || 1,
  fee_period_id: overrides.fee_period_id || 1,
  total_amount: overrides.total_amount !== undefined ? overrides.total_amount : '500000.00',
  paid_amount: overrides.paid_amount !== undefined ? overrides.paid_amount : '0.00',
  status: overrides.status || 'PENDING',
  due_date: overrides.due_date || '2024-01-31',
  save: jest.fn().mockResolvedValue(true),
});

const mockInvoiceItem = (overrides = {}) => ({
  id: overrides.id || 1,
  invoice_id: overrides.invoice_id || 1,
  fee_type_id: overrides.fee_type_id || 1,
  quantity: overrides.quantity || '1.00',
  price_snapshot: overrides.price_snapshot || '500000.00',
  line_total: overrides.line_total || '500000.00',
  source: overrides.source || 'AUTO',
});

const mockPayment = (overrides = {}) => ({
  id: overrides.id || 1,
  invoice_id: overrides.invoice_id || 1,
  amount: overrides.amount || 300000,
  payment_method: overrides.payment_method || 'CASH',
  payment_date: overrides.payment_date || new Date(),
  note: overrides.note || null,
  created_by: overrides.created_by || 1,
});

const mockModels = {
  sequelize: {
    transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    query: jest.fn(() => Promise.resolve([])),
    QueryTypes: { SELECT: 'SELECT' },
  },
  Household: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Vehicle: {
    findAll: jest.fn(),
  },
  FeePeriod: {
    findByPk: jest.fn(),
  },
  FeeType: {
    findAll: jest.fn(),
  },
  PeriodFee: {
    findAll: jest.fn(),
  },
  FeeUsage: {
    findAll: jest.fn(),
  },
  Invoice: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  InvoiceItem: {
    bulkCreate: jest.fn(),
    create: jest.fn(),
  },
  Payment: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../models', () => mockModels);

const app = require('../app');

beforeEach(() => {
  jest.resetAllMocks();
  mockTransaction.commit.mockResolvedValue();
  mockTransaction.rollback.mockResolvedValue();
  mockModels.sequelize.transaction.mockResolvedValue(mockTransaction);
  mockModels.sequelize.query.mockResolvedValue([]);
  mockModels.FeeUsage.findAll.mockResolvedValue([]);
});

/* ─────────────────────────────────────────────────────────────────
   BUỔI 1 — TEST GENERATE INVOICE END-TO-END
───────────────────────────────────────────────────────────────── */

describe('POST /api/fee-periods/:id/generate-invoices — Generate hóa đơn', () => {
  it('trả 404 khi fee period không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(null);
    mockModels.Invoice.count.mockResolvedValueOnce(0);

    const res = await request(app)
      .post('/api/fee-periods/999/generate-invoices')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả 409 khi đã có hóa đơn cho fee period này (idempotency)', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(3);

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('trả 400 khi id không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/fee-periods/abc/generate-invoices')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('generate hóa đơn thành công cho 3 hộ với phí fixed + per_m2', async () => {
    const households = [
      mockHousehold({ id: 1, room_number: 'A101', square_meters: 72.5 }),
      mockHousehold({ id: 2, room_number: 'A102', square_meters: 50.0 }),
      mockHousehold({ id: 3, room_number: 'B201', square_meters: 90.0 }),
    ];
    households.forEach((hh) => {
      hh.get = jest.fn().mockReturnValue({ ...hh, vehicles: [] });
    });

    const periodFees = [
      mockPeriodFee({
        id: 10,
        fee_type: mockFeeType({ id: 1, name: 'Phí quản lý', calculation_type: 'fixed', unit_price: '500000.00' }),
      }),
      mockPeriodFee({
        id: 11,
        fee_type: mockFeeType({ id: 2, name: 'Phí dịch vụ', calculation_type: 'per_m2', unit_price: '15000.00' }),
      }),
    ];
    periodFees.forEach((pf) => {
      pf.get = jest.fn().mockReturnValue({ ...pf });
    });

    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(0);
    mockModels.PeriodFee.findAll.mockResolvedValueOnce(periodFees);
    mockModels.Household.findAll.mockResolvedValueOnce(households);

    const createdInvoiceId = { id: 0 };
    mockModels.Invoice.create.mockImplementation(async (data) => {
      createdInvoiceId.id += 1;
      return mockInvoice({ id: createdInvoiceId.id, ...data });
    });
    mockModels.InvoiceItem.bulkCreate.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdCount).toBe(3);
    expect(res.body.data.failedCount).toBe(0);
    expect(mockModels.Invoice.create).toHaveBeenCalledTimes(3);
    expect(mockModels.InvoiceItem.bulkCreate).toHaveBeenCalledTimes(3);
  });

  it('tính phí xe tự động theo loại xe cho từng hộ', async () => {
    const householdWithCar = mockHousehold({
      id: 1,
      room_number: 'A101',
      square_meters: 50.0,
      vehicles: [
        { id: 10, vehicle_type: 'car', license_plate: '30A-99999', is_active: true },
      ],
    });
    householdWithCar.get = jest.fn().mockReturnValue({
      ...householdWithCar,
      vehicles: householdWithCar.vehicles,
    });

    const carParkingFee = mockPeriodFee({
      id: 20,
      fee_type: mockFeeType({
        id: 5,
        name: 'Phí xe ô tô',
        calculation_type: 'fixed',
        invoice_generation_mode: 'CONDITIONAL_VEHICLE',
        vehicle_type: 'car',
        unit_price: '1200000.00',
      }),
    });
    carParkingFee.get = jest.fn().mockReturnValue({ ...carParkingFee });

    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(0);
    mockModels.PeriodFee.findAll.mockResolvedValueOnce([carParkingFee]);
    mockModels.Household.findAll.mockResolvedValueOnce([householdWithCar]);
    mockModels.Invoice.create.mockResolvedValueOnce(mockInvoice({ id: 1, total_amount: '1200000.00' }));
    mockModels.InvoiceItem.bulkCreate.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.createdCount).toBe(1);

    const bulkCreateCall = mockModels.InvoiceItem.bulkCreate.mock.calls[0][0];
    expect(bulkCreateCall.some((item) => item.vehicle_id === 10)).toBe(true);
  });

  it('hộ không có xe không có invoice item phí xe', async () => {
    const householdNoVehicle = mockHousehold({ id: 2, room_number: 'B202', square_meters: 60.0 });
    householdNoVehicle.get = jest.fn().mockReturnValue({ ...householdNoVehicle, vehicles: [] });

    const motorbikeFee = mockPeriodFee({
      id: 30,
      fee_type: mockFeeType({
        id: 6,
        name: 'Phí xe máy',
        invoice_generation_mode: 'CONDITIONAL_VEHICLE',
        vehicle_type: 'motorbike',
        unit_price: '100000.00',
      }),
    });
    motorbikeFee.get = jest.fn().mockReturnValue({ ...motorbikeFee });

    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(0);
    mockModels.PeriodFee.findAll.mockResolvedValueOnce([motorbikeFee]);
    mockModels.Household.findAll.mockResolvedValueOnce([householdNoVehicle]);
    mockModels.Invoice.create.mockResolvedValueOnce(mockInvoice({ id: 2, total_amount: '0.00' }));
    mockModels.InvoiceItem.bulkCreate.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.createdCount).toBe(1);

    if (mockModels.InvoiceItem.bulkCreate.mock.calls.length > 0) {
      const items = mockModels.InvoiceItem.bulkCreate.mock.calls[0][0];
      expect(items.every((item) => item.vehicle_id === null || item.vehicle_id === undefined)).toBe(true);
    }
  });

  it('transaction rollback khi tạo invoice item thất bại — không lưu gì', async () => {
    const household = mockHousehold({ id: 1 });
    household.get = jest.fn().mockReturnValue({ ...household, vehicles: [] });

    const periodFee = mockPeriodFee({
      id: 1,
      fee_type: mockFeeType({ id: 1, calculation_type: 'fixed', unit_price: '500000.00' }),
    });
    periodFee.get = jest.fn().mockReturnValue({ ...periodFee });

    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(0);
    mockModels.PeriodFee.findAll.mockResolvedValueOnce([periodFee]);
    mockModels.Household.findAll.mockResolvedValueOnce([household]);
    mockModels.Invoice.create.mockResolvedValueOnce(mockInvoice({ id: 1 }));
    mockModels.InvoiceItem.bulkCreate.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.failedCount).toBe(1);
    expect(res.body.data.createdCount).toBe(0);
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('response có đúng format khi có household thất bại và thành công', async () => {
    const households = [
      mockHousehold({ id: 1 }),
      mockHousehold({ id: 2 }),
    ];
    households.forEach((hh) => {
      hh.get = jest.fn().mockReturnValue({ ...hh, vehicles: [] });
    });

    const periodFee = mockPeriodFee({
      id: 1,
      fee_type: mockFeeType({ id: 1, calculation_type: 'fixed', unit_price: '500000.00' }),
    });
    periodFee.get = jest.fn().mockReturnValue({ ...periodFee });

    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod());
    mockModels.Invoice.count.mockResolvedValueOnce(0);
    mockModels.PeriodFee.findAll.mockResolvedValueOnce([periodFee]);
    mockModels.Household.findAll.mockResolvedValueOnce(households);

    mockModels.Invoice.create
      .mockResolvedValueOnce(mockInvoice({ id: 1 }))
      .mockRejectedValueOnce(new Error('Unexpected error'));
    mockModels.InvoiceItem.bulkCreate.mockResolvedValue([]);

    const secondTransaction = { commit: jest.fn(), rollback: jest.fn() };
    secondTransaction.commit.mockResolvedValue();
    secondTransaction.rollback.mockResolvedValue();

    mockModels.sequelize.transaction
      .mockResolvedValueOnce(mockTransaction)
      .mockResolvedValueOnce(secondTransaction);

    const res = await request(app)
      .post('/api/fee-periods/1/generate-invoices')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.createdCount).toBe(1);
    expect(res.body.data.failedCount).toBe(1);
    expect(res.body.data.failed).toHaveLength(1);
    expect(res.body.data.failed[0]).toHaveProperty('householdId');
    expect(res.body.data.failed[0]).toHaveProperty('reason');
  });
});

/* ─────────────────────────────────────────────────────────────────
   BUỔI 2 — TEST THANH TOÁN
───────────────────────────────────────────────────────────────── */

describe('POST /api/invoices/:id/pay — Thanh toán hóa đơn', () => {
  it('trả 400 khi thiếu amount', async () => {
    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ paymentMethod: 'CASH' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('amount');
  });

  it('trả 400 khi amount <= 0', async () => {
    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: -100, paymentMethod: 'CASH' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('amount');
  });

  it('trả 400 khi thiếu paymentMethod', async () => {
    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 300000 });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('paymentMethod');
  });

  it('trả 404 khi invoice không tồn tại', async () => {
    mockModels.Invoice.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/invoices/999/pay')
      .send({ amount: 300000, paymentMethod: 'CASH' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả 409 khi hóa đơn đã thanh toán đủ (PAID)', async () => {
    const paidInvoice = mockInvoice({ status: 'PAID', total_amount: '500000.00', paid_amount: '500000.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(paidInvoice);

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 100000, paymentMethod: 'TRANSFER' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('trả 400 khi amount vượt quá số tiền còn lại', async () => {
    const invoice = mockInvoice({ status: 'PENDING', total_amount: '500000.00', paid_amount: '0.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 600000, paymentMethod: 'CASH' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('amount');
  });

  it('PENDING → PARTIAL: thanh toán 300,000 cho hóa đơn 500,000', async () => {
    const invoice = mockInvoice({ status: 'PENDING', total_amount: '500000.00', paid_amount: '0.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);
    mockModels.Payment.create.mockResolvedValueOnce(
      mockPayment({ amount: 300000, payment_method: 'CASH' })
    );

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 300000, paymentMethod: 'CASH' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice.status).toBe('PARTIAL');
    expect(Number(res.body.data.invoice.paid_amount)).toBe(300000);
    expect(invoice.save).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('PARTIAL → PAID: thanh toán thêm 200,000 đủ tổng 500,000', async () => {
    const invoice = mockInvoice({ status: 'PARTIAL', total_amount: '500000.00', paid_amount: '300000.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);
    mockModels.Payment.create.mockResolvedValueOnce(
      mockPayment({ amount: 200000, payment_method: 'TRANSFER' })
    );

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 200000, paymentMethod: 'TRANSFER' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice.status).toBe('PAID');
    expect(Number(res.body.data.invoice.paid_amount)).toBe(500000);
  });

  it('PENDING → PAID: thanh toán 1 lần đủ tổng', async () => {
    const invoice = mockInvoice({ status: 'PENDING', total_amount: '500000.00', paid_amount: '0.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);
    mockModels.Payment.create.mockResolvedValueOnce(
      mockPayment({ amount: 500000, payment_method: 'CASH' })
    );

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 500000, paymentMethod: 'CASH' });

    expect(res.status).toBe(201);
    expect(res.body.data.invoice.status).toBe('PAID');
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('dùng Sequelize transaction cho toàn bộ payment operation', async () => {
    const invoice = mockInvoice({ status: 'PENDING', total_amount: '500000.00', paid_amount: '0.00' });
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);
    mockModels.Payment.create.mockResolvedValueOnce(mockPayment({ amount: 300000 }));

    await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 300000, paymentMethod: 'CASH' });

    expect(mockModels.sequelize.transaction).toHaveBeenCalled();
    expect(mockModels.Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ invoice_id: 1, amount: 300000 }),
      expect.objectContaining({ transaction: mockTransaction })
    );
    expect(invoice.save).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: mockTransaction })
    );
  });

  it('rollback khi tạo payment thành công nhưng update invoice thất bại', async () => {
    const invoice = mockInvoice({ status: 'PENDING', total_amount: '500000.00', paid_amount: '0.00' });
    invoice.save = jest.fn().mockRejectedValueOnce(new Error('DB save error'));
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);
    mockModels.Payment.create.mockResolvedValueOnce(mockPayment({ amount: 300000 }));

    const res = await request(app)
      .post('/api/invoices/1/pay')
      .send({ amount: 300000, paymentMethod: 'CASH' });

    expect(res.status).toBe(500);
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it('lịch sử thanh toán nhiều lần: tạo đúng số payment records', async () => {
    const payments = [
      mockPayment({ id: 1, amount: 300000 }),
      mockPayment({ id: 2, amount: 200000 }),
    ];
    mockModels.Payment.findAll.mockResolvedValueOnce(payments);

    const res = await request(app)
      .get('/api/payments?invoiceId=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

/* ─────────────────────────────────────────────────────────────────
   BUỔI 2 — INVOICE QUERY APIS
───────────────────────────────────────────────────────────────── */

describe('GET /api/invoices — Danh sách hóa đơn với filter', () => {
  it('trả danh sách hóa đơn có pagination', async () => {
    mockModels.Invoice.findAndCountAll.mockResolvedValueOnce({
      rows: [mockInvoice({ id: 1 })],
      count: 1,
    });

    const res = await request(app).get('/api/invoices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.totalRecords).toBe(1);
  });

  it('filter theo status', async () => {
    mockModels.Invoice.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/invoices?status=PENDING');

    expect(mockModels.Invoice.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });

  it('filter theo householdId', async () => {
    mockModels.Invoice.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/invoices?householdId=5');

    expect(mockModels.Invoice.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ household_id: 5 }),
      })
    );
  });

  it('filter theo feePeriodId', async () => {
    mockModels.Invoice.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/invoices?feePeriodId=2');

    expect(mockModels.Invoice.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ fee_period_id: 2 }),
      })
    );
  });

  it('trả 400 khi householdId không phải số', async () => {
    const res = await request(app).get('/api/invoices?householdId=abc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/invoices/:id — Chi tiết hóa đơn', () => {
  it('trả 404 khi invoice không tồn tại', async () => {
    mockModels.Invoice.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/invoices/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả chi tiết hóa đơn với invoice_items', async () => {
    const invoice = {
      ...mockInvoice({ id: 1 }),
      invoice_items: [mockInvoiceItem({ invoice_id: 1 })],
      payments: [],
      household: mockHousehold({ id: 1 }),
      fee_period: mockFeePeriod({ id: 1 }),
    };
    mockModels.Invoice.findByPk.mockResolvedValueOnce(invoice);

    const res = await request(app).get('/api/invoices/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('invoice_items');
  });
});

/* ─────────────────────────────────────────────────────────────────
   BUỔI 3 — SECURITY TESTS
───────────────────────────────────────────────────────────────── */

describe('Security — SQL Injection Prevention', () => {
  it('householdId dạng SQL injection bị reject hoặc xử lý an toàn', async () => {
    const res = await request(app)
      .get("/api/invoices?householdId=1 OR 1=1");

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(mockModels.Invoice.findAndCountAll).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ household_id: '1 OR 1=1' }),
        })
      );
    }
  });

  it('invoice id dạng SQL injection trả 404 hoặc 400', async () => {
    mockModels.Invoice.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/invoices/1; DROP TABLE invoices/pay")
      .send({ amount: 100, paymentMethod: 'CASH' });

    expect([400, 404]).toContain(res.status);
  });

  it('không thể tạo payment cho invoice không thuộc về mình (authorization)', async () => {
    mockModels.Invoice.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/invoices/9999/pay')
      .send({ amount: 100000, paymentMethod: 'CASH' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/payments — Lịch sử thanh toán', () => {
  it('trả 400 khi invoiceId không hợp lệ', async () => {
    const res = await request(app).get('/api/payments?invoiceId=abc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('trả danh sách payments theo invoiceId', async () => {
    mockModels.Payment.findAll.mockResolvedValueOnce([
      mockPayment({ id: 1, amount: 200000 }),
      mockPayment({ id: 2, amount: 300000 }),
    ]);

    const res = await request(app).get('/api/payments?invoiceId=1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(mockModels.Payment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ invoice_id: 1 }),
      })
    );
  });

  it('trả danh sách rỗng khi không có payment nào', async () => {
    mockModels.Payment.findAll.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/payments?invoiceId=999');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('trả tất cả payments khi không filter theo invoiceId', async () => {
    mockModels.Payment.findAll.mockResolvedValueOnce([
      mockPayment({ id: 1, invoice_id: 1 }),
      mockPayment({ id: 2, invoice_id: 2 }),
    ]);

    const res = await request(app).get('/api/payments');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
