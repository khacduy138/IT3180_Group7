'use strict';
const { v4: uuidv4 } = require('uuid');

/**
 * UAT Test Data Seeder — Sprint 4
 * Tạo bộ dữ liệu cô lập để chạy User Acceptance Testing:
 *   - 10 hộ gia đình mẫu (UAT-01–UAT-10)
 *   - 3 loại phí: Phí quản lý (per_m2), Tiền điện (MANUAL_INPUT), Gửi xe máy (CONDITIONAL_VEHICLE)
 *   - 1 đợt thu: Tháng 6/2026 (DRAFT, chưa active — tester sẽ tự activate trong UAT)
 *   - Mỗi hộ có 1–2 cư dân, một số hộ có phương tiện để test CONDITIONAL_VEHICLE
 *
 * Chạy: npx sequelize-cli db:seed --seed 20260609000200-uat-test-data.js
 * Undo: npx sequelize-cli db:seed:undo --seed 20260609000200-uat-test-data.js
 */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('--- [UAT] Bắt đầu tạo dữ liệu test UAT Sprint 4 ---');

      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = 'admin' LIMIT 1`,
        { transaction }
      );
      const adminId = users.length > 0 ? users[0].id : 1;

      // ─── 1. 10 HỘ GIA ĐÌNH MẪU ──────────────────────────────────────────
      // Diện tích cố định để kết quả tính phí per_m2 dễ kiểm tra
      const householdData = [
        { room: 'UAT-01', sqm: 50.00 },  // Phí QL = 50 × 15,000 = 750,000
        { room: 'UAT-02', sqm: 60.00 },  // Phí QL = 60 × 15,000 = 900,000
        { room: 'UAT-03', sqm: 70.00 },  // Phí QL = 70 × 15,000 = 1,050,000
        { room: 'UAT-04', sqm: 80.00 },  // Phí QL = 80 × 15,000 = 1,200,000
        { room: 'UAT-05', sqm: 90.00 },  // Phí QL = 90 × 15,000 = 1,350,000
        { room: 'UAT-06', sqm: 100.00 }, // Phí QL = 100 × 15,000 = 1,500,000
        { room: 'UAT-07', sqm: 55.00 },  // Phí QL = 55 × 15,000 = 825,000
        { room: 'UAT-08', sqm: 65.00 },  // Phí QL = 65 × 15,000 = 975,000
        { room: 'UAT-09', sqm: 75.00 },  // Phí QL = 75 × 15,000 = 1,125,000
        { room: 'UAT-10', sqm: 85.00 },  // Phí QL = 85 × 15,000 = 1,275,000
      ];

      const households = householdData.map((h) => ({
        uuid: uuidv4(),
        room_number: h.room,
        square_meters: h.sqm.toFixed(2),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await queryInterface.bulkInsert('households', households, { transaction });

      const [dbHouseholds] = await queryInterface.sequelize.query(
        `SELECT id, room_number, square_meters FROM households WHERE room_number LIKE 'UAT-%' ORDER BY room_number`,
        { transaction }
      );

      // ─── 2. CƯ DÂN (mỗi hộ 1–2 người) ───────────────────────────────────
      const residentData = [
        { name: 'Nguyễn Văn An',    cccd: '099UAT000001', gender: 'Male',   phone: '0901000001' },
        { name: 'Nguyễn Thị Bình',  cccd: '099UAT000002', gender: 'Female', phone: '0901000002' },
        { name: 'Trần Văn Chi',      cccd: '099UAT000003', gender: 'Male',   phone: '0901000003' },
        { name: 'Trần Thị Dung',     cccd: '099UAT000004', gender: 'Female', phone: '0901000004' },
        { name: 'Lê Đăng Hòa',       cccd: '099UAT000005', gender: 'Male',   phone: '0901000005' },
        { name: 'Lê Thị Hương',      cccd: '099UAT000006', gender: 'Female', phone: '0901000006' },
        { name: 'Phạm Minh Khôi',    cccd: '099UAT000007', gender: 'Male',   phone: '0901000007' },
        { name: 'Phạm Anh Linh',     cccd: '099UAT000008', gender: 'Female', phone: '0901000008' },
        { name: 'Hoàng Văn Minh',    cccd: '099UAT000009', gender: 'Male',   phone: '0901000009' },
        { name: 'Hoàng Thị Nam',     cccd: '099UAT000010', gender: 'Female', phone: '0901000010' },
        { name: 'Huỳnh Đăng Phúc',   cccd: '099UAT000011', gender: 'Male',   phone: '0901000011' },
        { name: 'Phan Thị Quỳnh',    cccd: '099UAT000012', gender: 'Female', phone: '0901000012' },
      ];

      const residents = residentData.map((r) => ({
        uuid: uuidv4(),
        full_name: r.name,
        citizen_id: r.cccd,
        gender: r.gender,
        phone_number: r.phone,
        date_of_birth: '1990-01-01',
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await queryInterface.bulkInsert('residents', residents, { transaction });

      const [dbResidents] = await queryInterface.sequelize.query(
        `SELECT id FROM residents WHERE citizen_id LIKE '099UAT%' ORDER BY citizen_id`,
        { transaction }
      );

      // Phân công: 10 hộ, 12 cư dân
      // Hộ 0–9 mỗi hộ 1 chủ hộ, hộ 0–1 có thêm 1 thành viên
      const memberAssignments = [
        { hhIdx: 0, resIdx: 0, rel: 'Chủ hộ' },
        { hhIdx: 0, resIdx: 1, rel: 'Vợ/Chồng' },
        { hhIdx: 1, resIdx: 2, rel: 'Chủ hộ' },
        { hhIdx: 1, resIdx: 3, rel: 'Vợ/Chồng' },
        { hhIdx: 2, resIdx: 4, rel: 'Chủ hộ' },
        { hhIdx: 2, resIdx: 5, rel: 'Vợ/Chồng' },
        { hhIdx: 3, resIdx: 6, rel: 'Chủ hộ' },
        { hhIdx: 4, resIdx: 7, rel: 'Chủ hộ' },
        { hhIdx: 5, resIdx: 8, rel: 'Chủ hộ' },
        { hhIdx: 6, resIdx: 9, rel: 'Chủ hộ' },
        { hhIdx: 7, resIdx: 10, rel: 'Chủ hộ' },
        { hhIdx: 8, resIdx: 11, rel: 'Chủ hộ' },
      ];

      const members = memberAssignments.map((a) => ({
        household_id: dbHouseholds[a.hhIdx].id,
        resident_id: dbResidents[a.resIdx].id,
        relationship_to_head: a.rel,
        move_in_date: '2026-01-01',
        created_at: new Date(),
      }));
      await queryInterface.bulkInsert('household_members', members, { transaction });

      // ─── 3. PHƯƠNG TIỆN (5 hộ có xe máy để test CONDITIONAL_VEHICLE) ─────
      // P901, P903, P905, P907, P909 mỗi hộ 1 xe máy
      // P902 có 1 ô tô (để test fee type khác không bị tính vào)
      const vehicleHhIdxs = [0, 2, 4, 6, 8]; // P901, P903, P905, P907, P909
      const carHhIdx = 1; // P902

      const vehicles = vehicleHhIdxs.map((idx, i) => ({
        household_id: dbHouseholds[idx].id,
        vehicle_type: 'motorbike',
        license_plate: `30UAT${(100 + i).toString()}`,
        registered_at: '2026-01-01',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      vehicles.push({
        household_id: dbHouseholds[carHhIdx].id,
        vehicle_type: 'car',
        license_plate: '51UAT200',
        registered_at: '2026-01-01',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await queryInterface.bulkInsert('vehicles', vehicles, { transaction });

      // ─── 4. 3 LOẠI PHÍ UAT ───────────────────────────────────────────────
      //   FT-UAT-1: Phí quản lý — per_m2, AUTO, 15,000/m²
      //   FT-UAT-2: Tiền điện   — fixed,  MANUAL_INPUT, 3,500/kWh
      //   FT-UAT-3: Gửi xe máy — fixed,  CONDITIONAL_VEHICLE, 70,000/xe
      const feeTypes = [
        {
          code: 'UAT-QL',
          name: '[UAT] Phí quản lý',
          calculation_type: 'per_m2',
          unit: 'm2',
          unit_price: 15000,
          is_mandatory: true,
          is_active: true,
          invoice_generation_mode: 'AUTO',
          vehicle_type: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          code: 'UAT-DIEN',
          name: '[UAT] Tiền điện',
          calculation_type: 'fixed',
          unit: 'kWh',
          unit_price: 3500,
          is_mandatory: true,
          is_active: true,
          invoice_generation_mode: 'MANUAL_INPUT',
          vehicle_type: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          code: 'UAT-XEM',
          name: '[UAT] Gửi xe máy',
          calculation_type: 'fixed',
          unit: 'xe',
          unit_price: 70000,
          is_mandatory: false,
          is_active: true,
          invoice_generation_mode: 'CONDITIONAL_VEHICLE',
          vehicle_type: 'motorbike',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      await queryInterface.bulkInsert('fee_types', feeTypes, { transaction });

      const [dbFeeTypes] = await queryInterface.sequelize.query(
        `SELECT id, code, unit_price FROM fee_types WHERE code LIKE 'UAT-%' ORDER BY code`,
        { transaction }
      );

      // Lịch sử giá (bắt buộc để generate invoice hoạt động)
      const priceHistory = dbFeeTypes.map((ft) => ({
        fee_type_id: ft.id,
        unit_price: ft.unit_price,
        effective_from: '2026-01-01',
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await queryInterface.bulkInsert('fee_type_price_history', priceHistory, { transaction });
      const [dbHistory] = await queryInterface.sequelize.query(
        `SELECT id, fee_type_id FROM fee_type_price_history WHERE fee_type_id IN (${dbFeeTypes.map(f => f.id).join(',')})`,
        { transaction }
      );

      // ─── 5. ĐỢT THU PHÍ UAT — Tháng 6/2026 (DRAFT) ──────────────────────
      // Trạng thái DRAFT để tester có thể tự activate trong UAT Luồng 1
      await queryInterface.bulkInsert('fee_periods', [{
        code: 'UAT-2026-08',
        name: '[UAT] Tháng 8/2026',
        period_type: 'monthly',
        month: 8,
        year: 2026,
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        status: 'DRAFT',
        created_at: new Date(),
        updated_at: new Date(),
      }], { transaction });

      const [dbPeriods] = await queryInterface.sequelize.query(
        `SELECT id FROM fee_periods WHERE code = 'UAT-2026-08'`,
        { transaction }
      );
      const uatPeriodId = dbPeriods[0].id;

      // Liên kết 3 loại phí vào đợt thu
      const pFees = dbFeeTypes.map((ft) => ({
        fee_period_id: uatPeriodId,
        fee_type_id: ft.id,
        created_at: new Date(),
      }));
      await queryInterface.bulkInsert('period_fees', pFees, { transaction });

      const pfLinkage = dbFeeTypes.map((ft) => {
        const hist = dbHistory.find((h) => h.fee_type_id === ft.id);
        return {
          fee_period_id: uatPeriodId,
          fee_type_id: ft.id,
          price_history_id: hist.id,
          is_required: 1,
          created_at: new Date(),
        };
      });
      await queryInterface.bulkInsert('fee_period_fee_types', pfLinkage, { transaction });

      await transaction.commit();

      console.log('');
      console.log('✅ [UAT] Dữ liệu test đã sẵn sàng!');
      console.log('');
      console.log('📋 Tóm tắt:');
      console.log(`   • 10 hộ UAT: UAT-01–UAT-10 (diện tích 50–100 m²)`);
      console.log(`   • 12 cư dân (hộ UAT-01, UAT-02, UAT-03 có 2 người)`);
      console.log(`   • 5 xe máy (UAT-01, UAT-03, UAT-05, UAT-07, UAT-09), 1 ô tô (UAT-02)`);
      console.log(`   • 3 loại phí: [UAT-QL], [UAT-DIEN], [UAT-XEM]`);
      console.log(`   • 1 đợt thu DRAFT: [UAT] Tháng 8/2026 (code: UAT-2026-08)`);
      console.log('');
      console.log('🔑 Kết quả mong đợi sau generate invoice (per household):');
      console.log('   UAT-01 (50m²): QL=750,000 + XEM=70,000 + ĐIỆN(thủ công)');
      console.log('   UAT-02 (60m²): QL=900,000 + ĐIỆN(thủ công) [ô tô không tính]');
      console.log('   UAT-03 (70m²): QL=1,050,000 + XEM=70,000 + ĐIỆN(thủ công)');
      console.log('   UAT-04 (80m²): QL=1,200,000 + ĐIỆN(thủ công)');
      console.log('   UAT-05 (90m²): QL=1,350,000 + XEM=70,000 + ĐIỆN(thủ công)');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [UAT] LỖI TẠO DỮ LIỆU TEST:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { transaction });

      // Lấy fee_period id để xóa các bản ghi liên quan
      const [periods] = await queryInterface.sequelize.query(
        `SELECT id FROM fee_periods WHERE code = 'UAT-2026-08'`,
        { transaction }
      );
      const [feeTypes] = await queryInterface.sequelize.query(
        `SELECT id FROM fee_types WHERE code LIKE 'UAT-%'`,
        { transaction }
      );
      const [households] = await queryInterface.sequelize.query(
        `SELECT id FROM households WHERE room_number LIKE 'UAT-%'`,
        { transaction }
      );
      const [residents] = await queryInterface.sequelize.query(
        `SELECT id FROM residents WHERE citizen_id LIKE '099UAT%'`,
        { transaction }
      );

      if (periods.length > 0) {
        const pIds = periods.map((p) => p.id).join(',');
        await queryInterface.sequelize.query(`DELETE FROM fee_period_fee_types WHERE fee_period_id IN (${pIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM period_fees WHERE fee_period_id IN (${pIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE fee_period_id IN (${pIds}))`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE fee_period_id IN (${pIds}))`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM invoices WHERE fee_period_id IN (${pIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM fee_periods WHERE id IN (${pIds})`, { transaction });
      }

      if (feeTypes.length > 0) {
        const ftIds = feeTypes.map((f) => f.id).join(',');
        await queryInterface.sequelize.query(`DELETE FROM fee_type_price_history WHERE fee_type_id IN (${ftIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM fee_types WHERE id IN (${ftIds})`, { transaction });
      }

      if (households.length > 0) {
        const hhIds = households.map((h) => h.id).join(',');
        await queryInterface.sequelize.query(`DELETE FROM vehicles WHERE household_id IN (${hhIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM household_members WHERE household_id IN (${hhIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM fee_usages WHERE household_id IN (${hhIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM utility_invoices WHERE household_id IN (${hhIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM households WHERE id IN (${hhIds})`, { transaction });
      }

      if (residents.length > 0) {
        const rIds = residents.map((r) => r.id).join(',');
        await queryInterface.sequelize.query(`DELETE FROM demographic_changes WHERE resident_id IN (${rIds})`, { transaction });
        await queryInterface.sequelize.query(`DELETE FROM residents WHERE id IN (${rIds})`, { transaction });
      }

      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { transaction });
      await transaction.commit();
      console.log('✅ [UAT] Đã xóa dữ liệu test');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [UAT] LỖI XÓA DỮ LIỆU TEST:', error.message);
      throw error;
    }
  },
};
