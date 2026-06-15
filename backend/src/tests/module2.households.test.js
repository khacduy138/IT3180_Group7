'use strict';

const request = require('supertest');

jest.mock('../middleware/authenticate', () => (req, _res, next) => {
  req.user = {
    id: 1,
    username: 'testadmin',
    role: 'admin',
    role_id: 1,
    permissions: [
      'households:read',
      'households:write',
      'residents:read',
      'residents:write',
    ],
  };
  return next();
});

const mockHousehold = {
  id: 1,
  uuid: 'uuid-1',
  room_number: 'A101',
  square_meters: 72.5,
  status: 'active',
  deleted_at: null,
  update: jest.fn(),
};

const mockResident = {
  id: 1,
  uuid: 'uuid-r1',
  full_name: 'Nguyen Van A',
  gender: 'male',
  citizen_id: '001234567890',
  date_of_birth: '1990-01-01',
  phone_number: '0912345678',
  update: jest.fn(),
};

const mockMember = {
  id: 1,
  household_id: 1,
  resident_id: 1,
  relationship_to_head: 'head',
  move_in_date: '2024-01-01',
  move_out_date: null,
  update: jest.fn(),
};

const mockVehicle = (overrides = {}) => ({
  id: overrides.id || 1,
  household_id: overrides.household_id || 1,
  license_plate: overrides.license_plate || '30A-12345',
  vehicle_type: overrides.vehicle_type || 'motorbike',
  registered_at: overrides.registered_at || '2024-01-01',
  is_active: overrides.is_active !== undefined ? overrides.is_active : true,
  update: jest.fn(),
});

const mockModels = {
  sequelize: {
    transaction: jest.fn(() =>
      Promise.resolve({
        commit: jest.fn(),
        rollback: jest.fn(),
      })
    ),
  },
  Household: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Resident: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  HouseholdMember: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Vehicle: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  DemographicChange: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../models', () => mockModels);

const app = require('../app');

beforeEach(() => {
  jest.resetAllMocks();
  mockHousehold.update.mockResolvedValue(mockHousehold);
  mockResident.update.mockResolvedValue(mockResident);
  mockMember.update.mockResolvedValue(mockMember);
});

/* ─────────────────────────────────────────────────────────────────
   HOUSEHOLD CRUD
───────────────────────────────────────────────────────────────── */

describe('POST /api/households — Validation', () => {
  it('trả 400 khi thiếu roomNumber', async () => {
    const res = await request(app)
      .post('/api/households')
      .send({ squareMeters: 60 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('roomNumber');
  });

  it('trả 400 khi thiếu squareMeters', async () => {
    const res = await request(app)
      .post('/api/households')
      .send({ roomNumber: 'B202' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('squareMeters');
  });

  it('trả 400 khi squareMeters <= 0', async () => {
    const res = await request(app)
      .post('/api/households')
      .send({ roomNumber: 'B202', squareMeters: -10 });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('squareMeters');
  });

  it('trả 400 khi squareMeters không phải số', async () => {
    const res = await request(app)
      .post('/api/households')
      .send({ roomNumber: 'B202', squareMeters: 'abc' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('squareMeters');
  });

  it('trả 409 khi roomNumber đã tồn tại', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);

    const res = await request(app)
      .post('/api/households')
      .send({ roomNumber: 'A101', squareMeters: 60 });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('tạo thành công với dữ liệu hợp lệ (camelCase)', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);
    const newHousehold = { ...mockHousehold, room_number: 'C303', id: 2 };
    mockModels.Household.create.mockResolvedValueOnce(newHousehold);

    const res = await request(app)
      .post('/api/households')
      .send({ roomNumber: 'C303', squareMeters: 80 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockModels.Household.create).toHaveBeenCalledTimes(1);
  });

  it('tạo thành công với dữ liệu hợp lệ (snake_case)', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);
    const newHousehold = { ...mockHousehold, room_number: 'D404', id: 3 };
    mockModels.Household.create.mockResolvedValueOnce(newHousehold);

    const res = await request(app)
      .post('/api/households')
      .send({ room_number: 'D404', square_meters: 90 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/households — List với pagination', () => {
  it('trả danh sách có pagination metadata', async () => {
    mockModels.Household.findAndCountAll.mockResolvedValueOnce({
      rows: [mockHousehold],
      count: 1,
    });

    const res = await request(app).get('/api/households');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.totalRecords).toBe(1);
  });

  it('trả danh sách rỗng khi không có hộ nào', async () => {
    mockModels.Household.findAndCountAll.mockResolvedValueOnce({
      rows: [],
      count: 0,
    });

    const res = await request(app).get('/api/households');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalRecords).toBe(0);
  });
});

describe('DELETE /api/households/:id — Soft delete', () => {
  it('soft delete: trả 200 và set deleted_at', async () => {
    const household = { ...mockHousehold, update: jest.fn().mockResolvedValue(true) };
    mockModels.Household.findOne.mockResolvedValueOnce(household);

    const res = await request(app).delete('/api/households/1');

    expect(res.status).toBe(200);
    expect(household.update).toHaveBeenCalledWith({ deleted_at: expect.any(Date) });
  });

  it('trả 404 khi không tìm thấy hoặc đã bị soft delete', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/households/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('household đã soft delete không xuất hiện trong findOne (where deleted_at: null)', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/households/1');

    expect(res.status).toBe(404);
    expect(mockModels.Household.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deleted_at: null }),
      })
    );
  });

  it('listHouseholds chỉ query các hộ chưa bị xóa (where deleted_at: null)', async () => {
    mockModels.Household.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    await request(app).get('/api/households');

    expect(mockModels.Household.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deleted_at: null }),
      })
    );
  });
});

/* ─────────────────────────────────────────────────────────────────
   RESIDENTS
───────────────────────────────────────────────────────────────── */

describe('POST /api/households/:id/residents — Validation', () => {
  it('trả 400 khi thiếu fullName', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.sequelize.transaction.mockResolvedValueOnce({
      commit: jest.fn(),
      rollback: jest.fn(),
    });

    const res = await request(app)
      .post('/api/households/1/residents')
      .send({ gender: 'male' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('fullName');
  });

  it('trả 400 khi thiếu gender', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.sequelize.transaction.mockResolvedValueOnce({
      commit: jest.fn(),
      rollback: jest.fn(),
    });

    const res = await request(app)
      .post('/api/households/1/residents')
      .send({ fullName: 'Nguyen Van B' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('gender');
  });

  it('trả 404 khi household không tồn tại', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);
    mockModels.sequelize.transaction.mockResolvedValueOnce({
      commit: jest.fn(),
      rollback: jest.fn(),
    });

    const res = await request(app)
      .post('/api/households/999/residents')
      .send({ fullName: 'Nguyen Van B', gender: 'male' });

    expect(res.status).toBe(404);
  });

  it('trả 409 khi citizenId đã tồn tại trong hệ thống', async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Resident.findOne.mockResolvedValueOnce(mockResident);

    const res = await request(app)
      .post('/api/households/1/residents')
      .send({
        fullName: 'Tran Thi C',
        gender: 'female',
        citizenId: '001234567890',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('citizenId');
  });

  it('tạo resident thành công — moveInDate mặc định là ngày hôm nay', async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    mockModels.sequelize.transaction.mockResolvedValueOnce(t);
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Resident.findOne.mockResolvedValueOnce(null);
    mockModels.Resident.create.mockResolvedValueOnce(mockResident);
    mockModels.HouseholdMember.create.mockResolvedValueOnce(mockMember);

    const res = await request(app)
      .post('/api/households/1/residents')
      .send({ fullName: 'Le Van D', gender: 'male' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.membership).toBeDefined();
  });
});

describe('PUT /api/households/:id/residents/:residentId — Update resident', () => {
  it('trả 404 khi resident không tồn tại', async () => {
    mockModels.Resident.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/households/1/residents/999')
      .send({ fullName: 'New Name' });

    expect(res.status).toBe(404);
  });

  it('trả 400 khi fullName rỗng', async () => {
    mockModels.Resident.findByPk.mockResolvedValueOnce(mockResident);

    const res = await request(app)
      .put('/api/households/1/residents/1')
      .send({ fullName: '   ' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('fullName');
  });

  it('trả 409 khi citizenId trùng với resident khác', async () => {
    const residentA = { id: 1, citizen_id: '001111111111', update: jest.fn() };
    const residentB = { id: 2, citizen_id: '002222222222' };
    mockModels.Resident.findByPk.mockResolvedValueOnce(residentA);
    mockModels.Resident.findOne.mockResolvedValueOnce(residentB);

    const res = await request(app)
      .put('/api/households/1/residents/1')
      .send({ citizenId: '002222222222' });

    expect(res.status).toBe(409);
  });

  it('cập nhật thành công', async () => {
    const resident = { ...mockResident, update: jest.fn().mockResolvedValue(true) };
    mockModels.Resident.findByPk.mockResolvedValueOnce(resident);
    mockModels.Resident.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/households/1/residents/1')
      .send({ fullName: 'Updated Name', phoneNumber: '0987654321' });

    expect(res.status).toBe(200);
    expect(resident.update).toHaveBeenCalled();
  });
});

/* ─────────────────────────────────────────────────────────────────
   VEHICLES — GET /api/households/:id/vehicles
───────────────────────────────────────────────────────────────── */

describe('GET /api/households/:id/vehicles — Danh sách phương tiện', () => {
  it('trả 404 khi household không tồn tại', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/households/999/vehicles');

    expect(res.status).toBe(404);
  });

  it('trả mảng rỗng khi hộ có 0 xe', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findAll.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/households/1/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('trả đúng 1 xe khi hộ có 1 xe', async () => {
    const vehicle = mockVehicle({ license_plate: '30A-11111' });
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findAll.mockResolvedValueOnce([vehicle]);

    const res = await request(app).get('/api/households/1/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].license_plate).toBe('30A-11111');
  });

  it('trả đúng nhiều xe khi hộ có nhiều xe', async () => {
    const vehicles = [
      mockVehicle({ id: 1, license_plate: '30A-11111', vehicle_type: 'motorbike' }),
      mockVehicle({ id: 2, license_plate: '30B-22222', vehicle_type: 'car' }),
      mockVehicle({ id: 3, license_plate: '30C-33333', vehicle_type: 'motorbike' }),
    ];
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findAll.mockResolvedValueOnce(vehicles);

    const res = await request(app).get('/api/households/1/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('chỉ lấy xe đang active (is_active: true)', async () => {
    const activeVehicle = mockVehicle({ id: 1, is_active: true });
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findAll.mockResolvedValueOnce([activeVehicle]);

    await request(app).get('/api/households/1/vehicles');

    expect(mockModels.Vehicle.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ is_active: true }),
      })
    );
  });

  it('response có đầy đủ fields cần thiết cho Module 4', async () => {
    const vehicle = mockVehicle({
      id: 1,
      license_plate: '30A-11111',
      vehicle_type: 'car',
      household_id: 1,
      registered_at: '2024-01-01',
    });
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findAll.mockResolvedValueOnce([vehicle]);

    const res = await request(app).get('/api/households/1/vehicles');

    expect(res.status).toBe(200);
    const v = res.body.data[0];
    expect(v).toHaveProperty('id');
    expect(v).toHaveProperty('license_plate');
    expect(v).toHaveProperty('vehicle_type');
    expect(v).toHaveProperty('household_id');
    expect(v).toHaveProperty('registered_at');
  });
});

describe('POST /api/households/:id/vehicles — Thêm phương tiện', () => {
  it('trả 400 khi thiếu licensePlate', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);

    const res = await request(app)
      .post('/api/households/1/vehicles')
      .send({ vehicleType: 'motorbike', registeredAt: '2024-01-01' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('licensePlate');
  });

  it('trả 400 khi thiếu vehicleType', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);

    const res = await request(app)
      .post('/api/households/1/vehicles')
      .send({ licensePlate: '30A-99999', registeredAt: '2024-01-01' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('vehicleType');
  });

  it('trả 409 khi biển số xe đã tồn tại trong hệ thống', async () => {
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findOne.mockResolvedValueOnce(mockVehicle({ license_plate: '30A-12345' }));

    const res = await request(app)
      .post('/api/households/1/vehicles')
      .send({ licensePlate: '30A-12345', vehicleType: 'motorbike', registeredAt: '2024-01-01' });

    expect(res.status).toBe(409);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('licensePlate');
  });

  it('thêm xe thành công', async () => {
    const newVehicle = mockVehicle({ id: 5, license_plate: '30F-99999' });
    mockModels.Household.findOne.mockResolvedValueOnce(mockHousehold);
    mockModels.Vehicle.findOne.mockResolvedValueOnce(null);
    mockModels.Vehicle.create.mockResolvedValueOnce(newVehicle);

    const res = await request(app)
      .post('/api/households/1/vehicles')
      .send({ licensePlate: '30F-99999', vehicleType: 'car', registeredAt: '2024-06-01' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/households/:id/vehicles/:vehicleId — Xóa phương tiện', () => {
  it('trả 404 khi xe không thuộc hộ hoặc không tồn tại', async () => {
    mockModels.Vehicle.findOne.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/households/1/vehicles/999');

    expect(res.status).toBe(404);
  });

  it('xóa xe thành công: is_active = false', async () => {
    const vehicle = mockVehicle({ id: 1 });
    vehicle.update = jest.fn().mockResolvedValue(vehicle);
    mockModels.Vehicle.findOne.mockResolvedValueOnce(vehicle);

    const res = await request(app).delete('/api/households/1/vehicles/1');

    expect(res.status).toBe(200);
    expect(vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false })
    );
  });
});

/* ─────────────────────────────────────────────────────────────────
   BIẾN ĐỘNG NHÂN KHẨU — Edge Cases
───────────────────────────────────────────────────────────────── */

describe('POST /api/residents/:id/absence — Tạm vắng', () => {
  it('trả 400 khi thiếu startDate', async () => {
    const res = await request(app)
      .post('/api/residents/1/absence')
      .send({ endDate: '2024-12-31', destination: 'Ha Noi' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('startDate');
  });

  it('trả 400 khi thiếu endDate', async () => {
    const res = await request(app)
      .post('/api/residents/1/absence')
      .send({ startDate: '2024-01-01', destination: 'Ha Noi' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('endDate');
  });

  it('trả 400 khi endDate trước startDate', async () => {
    const res = await request(app)
      .post('/api/residents/1/absence')
      .send({ startDate: '2024-12-31', endDate: '2024-01-01', destination: 'Ha Noi' });

    expect(res.status).toBe(400);
    const errFields = res.body.errors.map((e) => e.field);
    expect(errFields).toContain('endDate');
  });

  it('trả 400 khi thiếu destination', async () => {
    const res = await request(app)
      .post('/api/residents/1/absence')
      .send({ startDate: '2024-01-01', endDate: '2024-06-01' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('destination');
  });

  it('trả 404 khi resident không tồn tại', async () => {
    mockModels.Resident.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/residents/999/absence')
      .send({ startDate: '2024-01-01', endDate: '2024-06-01', destination: 'Ha Noi' });

    expect(res.status).toBe(404);
  });

  it('trả 409 khi đã có bản ghi tạm vắng trùng startDate', async () => {
    mockModels.Resident.findByPk.mockResolvedValueOnce(mockResident);
    mockModels.HouseholdMember.findOne.mockResolvedValueOnce(mockMember);
    mockModels.DemographicChange.findOne.mockResolvedValueOnce({ id: 99 });

    const res = await request(app)
      .post('/api/residents/1/absence')
      .send({ startDate: '2024-01-01', endDate: '2024-06-01', destination: 'Ha Noi' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/residents/:id/temporary-residence — Tạm trú', () => {
  it('trả 400 khi thiếu originAddress', async () => {
    const res = await request(app)
      .post('/api/residents/1/temporary-residence')
      .send({ startDate: '2024-01-01' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('originAddress');
  });

  it('trả 400 khi thiếu startDate', async () => {
    const res = await request(app)
      .post('/api/residents/1/temporary-residence')
      .send({ originAddress: '123 Nguyen Hue' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('startDate');
  });

  it('trả 404 khi resident không tồn tại', async () => {
    mockModels.Resident.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/residents/999/temporary-residence')
      .send({ originAddress: '123 Nguyen Hue', startDate: '2024-01-01' });

    expect(res.status).toBe(404);
  });
});
