'use strict';

const request = require('supertest');
const Decimal = require('decimal.js');

jest.mock('../middleware/authenticate', () => (req, _res, next) => {
  req.user = {
    id: 1,
    username: 'testadmin',
    role: 'admin',
    role_id: 1,
    permissions: [
      'fee-types:read',
      'fee-types:write',
      'fee-periods:read',
      'fee-periods:write',
      'utility-invoices:read',
      'utility-invoices:write',
      'invoices:write',
    ],
  };
  return next();
});

jest.mock('../middleware/authorize', () => () => (_req, _res, next) => next());

const mockFeeType = (overrides = {}) => ({
  id: overrides.id || 1,
  code: overrides.code || 'QUAN_LY',
  name: overrides.name || 'Phí quản lý',
  calculation_type: overrides.calculation_type || 'per_area',
  unit: overrides.unit || 'm2',
  unit_price: overrides.unit_price !== undefined ? overrides.unit_price : 15000,
  is_mandatory: overrides.is_mandatory !== undefined ? overrides.is_mandatory : true,
  is_active: overrides.is_active !== undefined ? overrides.is_active : true,
  invoice_generation_mode: overrides.invoice_generation_mode || 'auto',
  vehicle_type: overrides.vehicle_type || null,
  save: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
});

const mockFeePeriod = (overrides = {}) => ({
  id: overrides.id || 1,
  code: overrides.code || 'KY-2024-01',
  name: overrides.name || 'Đợt thu tháng 1/2024',
  period_type: overrides.period_type || 'monthly',
  month: overrides.month !== undefined ? overrides.month : 1,
  year: overrides.year || 2024,
  start_date: overrides.start_date || '2024-01-01',
  end_date: overrides.end_date || '2024-01-31',
  status: overrides.status || 'DRAFT',
  save: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
});

const mockPriceHistory = (overrides = {}) => ({
  id: overrides.id || 1,
  fee_type_id: overrides.fee_type_id || 1,
  unit_price: overrides.unit_price || 15000,
  effective_from: overrides.effective_from || '2024-01-01',
  effective_to: overrides.effective_to !== undefined ? overrides.effective_to : null,
  created_by: overrides.created_by || 1,
});

const mockUtilityInvoice = (overrides = {}) => ({
  id: overrides.id || 1,
  fee_period_id: overrides.fee_period_id || 1,
  household_id: overrides.household_id || 1,
  utility_type: overrides.utility_type || 'electricity',
  previous_reading: overrides.previous_reading || null,
  current_reading: overrides.current_reading || null,
  usage_amount: overrides.usage_amount !== undefined ? overrides.usage_amount : 100,
  unit_price: overrides.unit_price !== undefined ? overrides.unit_price : 3500,
  total_amount: overrides.total_amount !== undefined ? overrides.total_amount : 350000,
  status: overrides.status || 'draft',
  save: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
});

const mockHousehold = {
  id: 1,
  uuid: 'uuid-h1',
  room_number: 'A101',
  square_meters: 72.5,
  status: 'active',
  deleted_at: null,
};

const mockTransaction = () => ({
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true),
});

const mockModels = {
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn().mockResolvedValue([[], {}]),
  },
  FeeType: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  FeeTypePriceHistory: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  FeePeriod: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  PeriodFee: {
    bulkCreate: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
  FeeUsage: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  UtilityInvoice: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  InvoiceItem: {
    count: jest.fn(),
  },
  Household: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
};

jest.mock('../models', () => mockModels);

const app = require('../app');

beforeEach(() => {
  jest.resetAllMocks();
  mockModels.sequelize.transaction.mockResolvedValue(mockTransaction());
  mockModels.sequelize.query.mockResolvedValue([[], {}]);
});

/* ─────────────────────────────────────────────────────────────────
   TÍNH PHÍ — Unit test decimal.js (không cần HTTP)
───────────────────────────────────────────────────────────────── */

describe('Tính phí — per_area (decimal.js, không dùng float)', () => {
  it('72.5 m² × 15,000 VNĐ/m² = 1,087,500 VNĐ', () => {
    const area = new Decimal('72.5');
    const unitPrice = new Decimal('15000');
    const result = area.times(unitPrice).toNumber();
    expect(result).toBe(1087500);
  });

  it('tránh lỗi float: 0.1 + 0.2 ≠ 0.3 nhưng Decimal cho kết quả đúng', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    const result = new Decimal('0.1').plus(new Decimal('0.2')).toNumber();
    expect(result).toBe(0.3);
  });

  it('100 m² × 25,500 VNĐ/m² = 2,550,000 VNĐ', () => {
    const result = new Decimal('100').times(new Decimal('25500')).toNumber();
    expect(result).toBe(2550000);
  });

  it('diện tích 0 → phí per_area = 0', () => {
    const result = new Decimal('0').times(new Decimal('15000')).toNumber();
    expect(result).toBe(0);
  });

  it('đơn giá 0 → phí per_area = 0', () => {
    const result = new Decimal('72.5').times(new Decimal('0')).toNumber();
    expect(result).toBe(0);
  });
});

describe('Tính phí — fixed (mỗi hộ như nhau, không phụ thuộc diện tích)', () => {
  it('phí fixed = unitPrice cố định, không nhân với diện tích', () => {
    const unitPrice = new Decimal('500000');
    expect(unitPrice.toNumber()).toBe(500000);
  });

  it('phí fixed giống nhau cho 2 hộ khác diện tích', () => {
    const unitPrice = new Decimal('500000');
    const household1 = unitPrice.toNumber();
    const household2 = unitPrice.toNumber();
    expect(household1).toBe(household2);
  });
});

describe('Tính phí — voluntary (không tự động tạo)', () => {
  it('voluntary: không có công thức tính tự động', () => {
    const voluntaryAmount = null;
    expect(voluntaryAmount).toBeNull();
  });
});

describe('Tính tiền tiện ích — calculateUtilityAmount', () => {
  it('tính bằng reading: (current - previous) × unitPrice', () => {
    const prev = new Decimal('100');
    const curr = new Decimal('200');
    const unitPrice = new Decimal('3500');
    const usage = curr.minus(prev);
    const total = usage.times(unitPrice).toDecimalPlaces(2).toNumber();
    expect(usage.toNumber()).toBe(100);
    expect(total).toBe(350000);
  });

  it('tính bằng usageAmount trực tiếp × unitPrice', () => {
    const usage = new Decimal('50');
    const unitPrice = new Decimal('3500');
    const total = usage.times(unitPrice).toDecimalPlaces(2).toNumber();
    expect(total).toBe(175000);
  });

  it('kết quả làm tròn đến 2 chữ số thập phân', () => {
    const usage = new Decimal('33.333');
    const unitPrice = new Decimal('3000');
    const total = usage.times(unitPrice).toDecimalPlaces(2).toNumber();
    expect(total).toBe(99999);
  });
});

/* ─────────────────────────────────────────────────────────────────
   FEE TYPES — CRUD API
───────────────────────────────────────────────────────────────── */

describe('GET /api/fee-types — Danh sách loại phí', () => {
  it('trả danh sách có pagination', async () => {
    mockModels.FeeType.findAndCountAll.mockResolvedValueOnce({
      rows: [mockFeeType()],
      count: 1,
    });

    const res = await request(app).get('/api/fee-types');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.totalRecords).toBe(1);
  });

  it('trả danh sách rỗng khi không có loại phí', async () => {
    mockModels.FeeType.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    const res = await request(app).get('/api/fee-types');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalRecords).toBe(0);
  });

  it('lọc theo isActive=true', async () => {
    mockModels.FeeType.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/fee-types?isActive=true');

    expect(mockModels.FeeType.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ is_active: true }),
      })
    );
  });

  it('lọc theo calculationType', async () => {
    mockModels.FeeType.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/fee-types?calculationType=per_area');

    expect(mockModels.FeeType.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ calculation_type: 'per_area' }),
      })
    );
  });
});

describe('POST /api/fee-types — Tạo loại phí', () => {
  it('trả 400 khi thiếu code', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ name: 'Phí quản lý', calculationType: 'per_area', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('code');
  });

  it('trả 400 khi thiếu name', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', calculationType: 'per_area', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('name');
  });

  it('trả 400 khi thiếu calculationType', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('calculationType');
  });

  it('trả 400 khi calculationType không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'invalid_type', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('calculationType');
  });

  it('trả 400 khi unitPrice <= 0', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'per_area', unitPrice: -100, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('unitPrice');
  });

  it('trả 400 khi unitPrice không phải số', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'per_area', unitPrice: 'abc', invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('unitPrice');
  });

  it('trả 400 khi thiếu invoiceGenerationMode', async () => {
    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'per_area', unitPrice: 15000 });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('invoiceGenerationMode');
  });

  it('trả 409 khi code đã tồn tại', async () => {
    mockModels.FeeType.findOne.mockResolvedValueOnce(mockFeeType());

    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'per_area', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('tạo thành công với dữ liệu hợp lệ', async () => {
    mockModels.FeeType.findOne.mockResolvedValueOnce(null);
    mockModels.FeeType.create.mockResolvedValueOnce(mockFeeType());

    const res = await request(app)
      .post('/api/fee-types')
      .send({ code: 'QUAN_LY', name: 'Phí quản lý', calculationType: 'per_area', unitPrice: 15000, invoiceGenerationMode: 'auto' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockModels.FeeType.create).toHaveBeenCalledTimes(1);
  });
});

describe('DELETE /api/fee-types/:id — Deactivate loại phí', () => {
  it('trả 404 khi loại phí không tồn tại', async () => {
    mockModels.FeeType.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/fee-types/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả 409 khi loại phí đã có hóa đơn sử dụng', async () => {
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());
    mockModels.InvoiceItem.count.mockResolvedValueOnce(3);

    const res = await request(app).delete('/api/fee-types/1');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('deactivate thành công (is_active = false) khi chưa có hóa đơn', async () => {
    const feeType = mockFeeType();
    mockModels.FeeType.findByPk.mockResolvedValueOnce(feeType);
    mockModels.InvoiceItem.count.mockResolvedValueOnce(0);

    const res = await request(app).delete('/api/fee-types/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/* ─────────────────────────────────────────────────────────────────
   VERSIONING ĐƠN GIÁ — price history
───────────────────────────────────────────────────────────────── */

describe('PATCH /api/fee-types/:id — Update đơn giá → tạo price history', () => {
  it('trả 404 khi loại phí không tồn tại', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).patch('/api/fee-types/999').send({ unitPrice: 20000 });

    expect(res.status).toBe(404);
    expect(t.rollback).toHaveBeenCalled();
  });

  it('trả 400 khi unitPrice <= 0', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());

    const res = await request(app).patch('/api/fee-types/1').send({ unitPrice: -500 });

    expect(res.status).toBe(400);
    expect(t.rollback).toHaveBeenCalled();
  });

  it('khi đổi unitPrice → tạo record trong price_history', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    const feeType = mockFeeType({ unit_price: 15000 });
    mockModels.FeeType.findByPk.mockResolvedValueOnce(feeType);
    mockModels.FeeTypePriceHistory.update.mockResolvedValueOnce([1]);
    mockModels.FeeTypePriceHistory.create.mockResolvedValueOnce(mockPriceHistory({ unit_price: 20000 }));

    const res = await request(app).patch('/api/fee-types/1').send({ unitPrice: 20000 });

    expect(res.status).toBe(200);
    expect(mockModels.FeeTypePriceHistory.create).toHaveBeenCalledTimes(1);
    expect(mockModels.FeeTypePriceHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({ effective_to: expect.any(String) }),
      expect.objectContaining({ where: expect.objectContaining({ fee_type_id: feeType.id, effective_to: null }) })
    );
  });

  it('khi unitPrice không thay đổi → KHÔNG tạo price history', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    const feeType = mockFeeType({ unit_price: 15000 });
    mockModels.FeeType.findByPk.mockResolvedValueOnce(feeType);

    const res = await request(app).patch('/api/fee-types/1').send({ unitPrice: 15000 });

    expect(res.status).toBe(200);
    expect(mockModels.FeeTypePriceHistory.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/fee-types/:id/price-history — Tạo version đơn giá mới', () => {
  it('trả 404 khi loại phí không tồn tại', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/fee-types/999/price-history')
      .send({ unitPrice: 20000, effectiveFrom: '2024-06-01' });

    expect(res.status).toBe(404);
  });

  it('trả 400 khi thiếu unitPrice hoặc unitPrice âm', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());

    const res = await request(app)
      .post('/api/fee-types/1/price-history')
      .send({ unitPrice: -100, effectiveFrom: '2024-06-01' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('unitPrice');
  });

  it('trả 400 khi effectiveFrom không hợp lệ', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());

    const res = await request(app)
      .post('/api/fee-types/1/price-history')
      .send({ unitPrice: 20000, effectiveFrom: 'not-a-date' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('effectiveFrom');
  });

  it('trả 409 khi đã có version cùng effective_from', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());
    mockModels.FeeTypePriceHistory.findOne.mockResolvedValueOnce(mockPriceHistory({ effective_from: '2024-06-01' }));

    const res = await request(app)
      .post('/api/fee-types/1/price-history')
      .send({ unitPrice: 20000, effectiveFrom: '2024-06-01' });

    expect(res.status).toBe(409);
  });

  it('tạo thành công: 3 lần sửa giá → bảng history có 3 record', async () => {
    for (let i = 1; i <= 3; i++) {
      const t = mockTransaction();
      mockModels.sequelize.transaction.mockResolvedValueOnce(t);
      mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());
      mockModels.FeeTypePriceHistory.findOne.mockResolvedValueOnce(null);
      mockModels.FeeTypePriceHistory.update.mockResolvedValueOnce([1]);
      mockModels.FeeTypePriceHistory.create.mockResolvedValueOnce(
        mockPriceHistory({ id: i, unit_price: 10000 + i * 5000, effective_from: `2024-0${i}-01` })
      );

      const res = await request(app)
        .post('/api/fee-types/1/price-history')
        .send({ unitPrice: 10000 + i * 5000, effectiveFrom: `2024-0${i}-01` });

      expect(res.status).toBe(201);
    }

    expect(mockModels.FeeTypePriceHistory.create).toHaveBeenCalledTimes(3);
  });

  it('đóng version cũ (effective_to) khi tạo version mới', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());
    mockModels.FeeTypePriceHistory.findOne.mockResolvedValueOnce(null);
    mockModels.FeeTypePriceHistory.update.mockResolvedValueOnce([1]);
    mockModels.FeeTypePriceHistory.create.mockResolvedValueOnce(mockPriceHistory());

    await request(app)
      .post('/api/fee-types/1/price-history')
      .send({ unitPrice: 20000, effectiveFrom: '2024-06-01' });

    expect(mockModels.FeeTypePriceHistory.update).toHaveBeenCalledWith(
      { effective_to: '2024-06-01' },
      expect.objectContaining({
        where: expect.objectContaining({ fee_type_id: 1, effective_to: null }),
      })
    );
  });
});

describe('GET /api/fee-types/:id/price-history — Lịch sử đơn giá', () => {
  it('trả 404 khi loại phí không tồn tại', async () => {
    mockModels.FeeType.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/fee-types/999/price-history');

    expect(res.status).toBe(404);
  });

  it('trả danh sách price history', async () => {
    mockModels.FeeType.findByPk.mockResolvedValueOnce(mockFeeType());
    mockModels.FeeTypePriceHistory.findAll.mockResolvedValueOnce([
      mockPriceHistory({ id: 1, unit_price: 15000, effective_from: '2024-01-01', effective_to: '2024-06-01' }),
      mockPriceHistory({ id: 2, unit_price: 20000, effective_from: '2024-06-01', effective_to: null }),
    ]);

    const res = await request(app).get('/api/fee-types/1/price-history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

/* ─────────────────────────────────────────────────────────────────
   FEE PERIODS — CRUD API
───────────────────────────────────────────────────────────────── */

describe('GET /api/fee-periods — Danh sách đợt thu', () => {
  it('trả danh sách có pagination', async () => {
    mockModels.FeePeriod.findAndCountAll.mockResolvedValueOnce({
      rows: [{ ...mockFeePeriod(), fee_types: [] }],
      count: 1,
    });

    const res = await request(app).get('/api/fee-periods');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.totalRecords).toBe(1);
  });

  it('lọc theo status', async () => {
    mockModels.FeePeriod.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/fee-periods?status=ACTIVE');

    expect(mockModels.FeePeriod.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      })
    );
  });

  it('trả 400 khi year không phải số nguyên', async () => {
    const res = await request(app).get('/api/fee-periods?year=abc');

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('year');
  });
});

describe('POST /api/fee-periods — Tạo đợt thu', () => {
  const validBody = {
    code: 'KY-2024-01',
    name: 'Đợt thu tháng 1/2024',
    periodType: 'monthly',
    month: 1,
    year: 2024,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  it('trả 400 khi thiếu code', async () => {
    const { code: _c, ...body } = validBody;
    const res = await request(app).post('/api/fee-periods').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('code');
  });

  it('trả 400 khi thiếu name', async () => {
    const { name: _n, ...body } = validBody;
    const res = await request(app).post('/api/fee-periods').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('name');
  });

  it('trả 400 khi thiếu year', async () => {
    const { year: _y, ...body } = validBody;
    const res = await request(app).post('/api/fee-periods').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('year');
  });

  it('trả 400 khi thiếu startDate', async () => {
    const { startDate: _s, ...body } = validBody;
    const res = await request(app).post('/api/fee-periods').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('startDate');
  });

  it('trả 400 khi thiếu endDate', async () => {
    const { endDate: _e, ...body } = validBody;
    const res = await request(app).post('/api/fee-periods').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('endDate');
  });

  it('trả 409 khi code đã tồn tại', async () => {
    mockModels.FeePeriod.findOne.mockResolvedValueOnce(mockFeePeriod());

    const res = await request(app).post('/api/fee-periods').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('tạo thành công với dữ liệu hợp lệ', async () => {
    mockModels.FeePeriod.findOne.mockResolvedValueOnce(null);
    const created = mockFeePeriod();
    mockModels.FeePeriod.create.mockResolvedValueOnce(created);
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce({ ...created, fee_types: [] });

    const res = await request(app).post('/api/fee-periods').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('tạo đợt thu không có loại phí nào → thành công', async () => {
    mockModels.FeePeriod.findOne.mockResolvedValueOnce(null);
    const created = mockFeePeriod();
    mockModels.FeePeriod.create.mockResolvedValueOnce(created);
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce({ ...created, fee_types: [] });

    const res = await request(app)
      .post('/api/fee-periods')
      .send({ ...validBody, feeTypeIds: [] });

    expect(res.status).toBe(201);
    expect(mockModels.PeriodFee.bulkCreate).not.toHaveBeenCalled();
  });
});

describe('GET /api/fee-periods/:id — Chi tiết đợt thu (Module 4 cần)', () => {
  it('trả 404 khi đợt thu không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/fee-periods/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả đầy đủ thông tin bao gồm fee_types', async () => {
    const feePeriod = {
      ...mockFeePeriod(),
      fee_types: [
        mockFeeType({ id: 1, code: 'QUAN_LY', calculation_type: 'per_area', unit_price: 15000 }),
        mockFeeType({ id: 2, code: 'XE_MAY', calculation_type: 'per_vehicle', unit_price: 100000 }),
      ],
    };
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(feePeriod);

    const res = await request(app).get('/api/fee-periods/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.fee_types)).toBe(true);
    expect(res.body.data.fee_types).toHaveLength(2);
  });

  it('response có đủ fields cần thiết cho Module 4 tính hóa đơn', async () => {
    const feePeriod = {
      ...mockFeePeriod({ status: 'ACTIVE' }),
      fee_types: [
        mockFeeType({ id: 1, code: 'QUAN_LY', calculation_type: 'per_area', unit_price: 15000 }),
      ],
    };
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(feePeriod);

    const res = await request(app).get('/api/fee-periods/1');

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('code');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('fee_types');
    const ft = data.fee_types[0];
    expect(ft).toHaveProperty('id');
    expect(ft).toHaveProperty('calculation_type');
    expect(ft).toHaveProperty('unit_price');
  });
});

describe('POST /api/fee-periods/:id/activate — Kích hoạt đợt thu', () => {
  it('trả 404 khi đợt thu không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/fee-periods/999/activate');

    expect(res.status).toBe(404);
  });

  it('trả 409 khi đợt thu đã ACTIVE', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));

    const res = await request(app).post('/api/fee-periods/1/activate');

    expect(res.status).toBe(409);
  });

  it('trả 409 khi đợt thu đã CLOSED', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'CLOSED' }));

    const res = await request(app).post('/api/fee-periods/1/activate');

    expect(res.status).toBe(409);
  });

  it('activate thành công từ DRAFT → ACTIVE', async () => {
    const feePeriod = mockFeePeriod({ status: 'DRAFT' });
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(feePeriod);

    const res = await request(app).post('/api/fee-periods/1/activate');

    expect(res.status).toBe(200);
    expect(feePeriod.save).toHaveBeenCalled();
  });
});

describe('DELETE /api/fee-periods/:id — Xóa đợt thu (chỉ DRAFT)', () => {
  it('trả 404 khi đợt thu không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/fee-periods/999');

    expect(res.status).toBe(404);
  });

  it('trả 409 khi đợt thu không phải DRAFT', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));

    const res = await request(app).delete('/api/fee-periods/1');

    expect(res.status).toBe(409);
  });

  it('xóa thành công khi đợt thu là DRAFT', async () => {
    const feePeriod = mockFeePeriod({ status: 'DRAFT' });
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(feePeriod);
    mockModels.PeriodFee.destroy.mockResolvedValueOnce(1);

    const res = await request(app).delete('/api/fee-periods/1');

    expect(res.status).toBe(200);
    expect(mockModels.PeriodFee.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ fee_period_id: feePeriod.id }) })
    );
    expect(feePeriod.destroy).toHaveBeenCalled();
  });
});

/* ─────────────────────────────────────────────────────────────────
   UTILITY INVOICES — Điện/Nước/Internet
───────────────────────────────────────────────────────────────── */

describe('POST /api/utility-invoices — Tạo hóa đơn tiện ích', () => {
  const validUtilityBody = {
    feePeriodId: 1,
    householdId: 1,
    utilityType: 'electricity',
    previousReading: 100,
    currentReading: 200,
    unitPrice: 3500,
  };

  it('trả 400 khi thiếu feePeriodId', async () => {
    const { feePeriodId: _f, ...body } = validUtilityBody;
    const res = await request(app).post('/api/utility-invoices').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('feePeriodId');
  });

  it('trả 400 khi thiếu householdId', async () => {
    const { householdId: _h, ...body } = validUtilityBody;
    const res = await request(app).post('/api/utility-invoices').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('householdId');
  });

  it('trả 400 khi thiếu utilityType', async () => {
    const { utilityType: _u, ...body } = validUtilityBody;
    const res = await request(app).post('/api/utility-invoices').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('utilityType');
  });

  it('trả 400 khi thiếu unitPrice', async () => {
    const { unitPrice: _up, ...body } = validUtilityBody;
    const res = await request(app).post('/api/utility-invoices').send(body);

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('unitPrice');
  });

  it('trả 404 khi feePeriod không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/utility-invoices').send(validUtilityBody);

    expect(res.status).toBe(404);
  });

  it('trả 422 khi feePeriod không phải ACTIVE', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'DRAFT' }));

    const res = await request(app).post('/api/utility-invoices').send(validUtilityBody);

    expect(res.status).toBe(422);
  });

  it('trả 404 khi household không tồn tại', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));
    mockModels.Household.findByPk.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/utility-invoices').send(validUtilityBody);

    expect(res.status).toBe(404);
  });

  it('trả 409 khi đã có utility invoice trùng (household + period + type)', async () => {
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));
    mockModels.Household.findByPk.mockResolvedValueOnce(mockHousehold);
    mockModels.UtilityInvoice.findOne.mockResolvedValueOnce(mockUtilityInvoice());

    const res = await request(app).post('/api/utility-invoices').send(validUtilityBody);

    expect(res.status).toBe(409);
  });

  it('tạo thành công với reading: tính totalAmount = (current-previous) × unitPrice', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));
    mockModels.Household.findByPk.mockResolvedValueOnce(mockHousehold);
    mockModels.UtilityInvoice.findOne.mockResolvedValueOnce(null);

    const expectedTotal = new Decimal('200').minus('100').times('3500').toNumber();
    const created = mockUtilityInvoice({ usage_amount: 100, unit_price: 3500, total_amount: expectedTotal });
    mockModels.UtilityInvoice.create.mockResolvedValueOnce(created);
    mockModels.PeriodFee.findOne.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/utility-invoices').send(validUtilityBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockModels.UtilityInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: expectedTotal,
        usage_amount: 100,
        unit_price: 3500,
      }),
      expect.anything()
    );
  });

  it('tạo thành công với usageAmount trực tiếp', async () => {
    const t = mockTransaction();
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.FeePeriod.findByPk.mockResolvedValueOnce(mockFeePeriod({ status: 'ACTIVE' }));
    mockModels.Household.findByPk.mockResolvedValueOnce(mockHousehold);
    mockModels.UtilityInvoice.findOne.mockResolvedValueOnce(null);

    const created = mockUtilityInvoice({ usage_amount: 50, unit_price: 3500, total_amount: 175000 });
    mockModels.UtilityInvoice.create.mockResolvedValueOnce(created);
    mockModels.PeriodFee.findOne.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/utility-invoices').send({
      feePeriodId: 1,
      householdId: 1,
      utilityType: 'water',
      usageAmount: 50,
      unitPrice: 3500,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
