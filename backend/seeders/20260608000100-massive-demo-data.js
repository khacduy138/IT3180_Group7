'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, _Sequelize) {
    try {
      // 1. Kiểm tra tài khoản Admin
      const [users] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
      if (users.length === 0) throw new Error("Hãy chạy 'npx sequelize-cli db:seed:all' trước.");
      const adminId = users[0].id;

      // 2. DỌN SẠCH DỮ LIỆU CŨ (Để tránh lỗi Duplicate entry)
      console.log("--- Đang dọn dẹp dữ liệu cũ... ---");
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      const tablesToClear = [
        'payments', 'invoice_items', 'invoices', 'period_fees', 
        'fee_periods', 'fee_types', 'vehicles', 'household_members', 
        'residents', 'households'
      ];
      for (const table of tablesToClear) {
        await queryInterface.sequelize.query(`TRUNCATE TABLE ${table};`);
      }
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

      // 3. Tạo 150 Hộ gia đình
      const households = [];
      for (let i = 1; i <= 150; i++) {
        const floor = Math.floor((i - 1) / 10) + 1;
        const room = ((i - 1) % 10) + 1;
        households.push({
          uuid: uuidv4(),
          room_number: `P${floor}${room.toString().padStart(2, '0')}`,
          square_meters: (Math.random() * (120 - 45) + 45).toFixed(2),
          status: 'active',
          created_at: new Date(), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('households', households);
      const [dbHouseholds] = await queryInterface.sequelize.query(`SELECT id, square_meters FROM households`);

      // 4. Tạo 500 Cư dân (Tổ hợp tên)
      const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
      const middles = ['Văn', 'Thị', 'Đăng', 'Minh', 'Hoài'];
      const lasts = ['An', 'Bình', 'Chi', 'Dương', 'Hòa', 'Giang', 'Hương', 'Khôi', 'Minh', 'Nam'];
      const residents = [];
      let rCount = 0;
      for (const s of surnames) {
        for (const m of middles) {
          for (const l of lasts) {
            if (rCount >= 500) break;
            residents.push({
              uuid: uuidv4(),
              full_name: `${s} ${m} ${l}`,
              citizen_id: `03009${(1000000 + rCount).toString()}`,
              gender: m === 'Thị' ? 'Female' : 'Male',
              phone_number: `09${(10000000 + rCount).toString()}`,
              created_at: new Date(), updated_at: new Date()
            });
            rCount++;
          }
        }
      }
      await queryInterface.bulkInsert('residents', residents);
      const [dbResidents] = await queryInterface.sequelize.query(`SELECT id FROM residents`);

      // 5. Liên kết nhân khẩu vào hộ (Đảm bảo mỗi Resident chỉ vào 1 hộ)
      const members = dbResidents.map((res, idx) => ({
        household_id: dbHouseholds[idx % dbHouseholds.length].id,
        resident_id: res.id,
        relationship_to_head: (idx < dbHouseholds.length) ? 'Chủ hộ' : 'Thành viên',
        move_in_date: '2026-01-01',
        created_at: new Date(), updated_at: new Date()
      }));
      await queryInterface.bulkInsert('household_members', members);

      // 6. Tạo 200 Phương tiện
      const vehicles = [];
      for (let i = 0; i < 200; i++) {
        vehicles.push({
          household_id: dbHouseholds[i % dbHouseholds.length].id,
          license_plate: `${Math.floor(Math.random()*89+10)}A-${20000 + i}`,
          vehicle_type: i % 4 === 0 ? 'car' : 'motorbike',
          registered_at: '2026-01-01',
          is_active: true,
          created_at: new Date(), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('vehicles', vehicles);
      const [dbVehicles] = await queryInterface.sequelize.query(`SELECT id, household_id, vehicle_type FROM vehicles`);

      // 7. Cấu hình Phí
      const feeTypes = [
        { code: 'QL', name: 'Phí quản lý', calculation_type: 'per_m2', unit_price: 15000, invoice_generation_mode: 'AUTO' },
        { code: 'DIEN', name: 'Tiền điện', calculation_type: 'fixed', unit_price: 3500, invoice_generation_mode: 'MANUAL_INPUT' },
        { code: 'XE_M', name: 'Gửi xe máy', calculation_type: 'fixed', unit_price: 70000, invoice_generation_mode: 'CONDITIONAL_VEHICLE', vehicle_type: 'motorbike' },
        { code: 'XE_O', name: 'Gửi ô tô', calculation_type: 'fixed', unit_price: 1200000, invoice_generation_mode: 'CONDITIONAL_VEHICLE', vehicle_type: 'car' }
      ];
      await queryInterface.bulkInsert('fee_types', feeTypes.map(f => ({...f, created_at: new Date(), updated_at: new Date()})));
      const [dbFeeTypes] = await queryInterface.sequelize.query(`SELECT id, code, unit_price FROM fee_types`);

      // 8. Tạo 6 Kỳ thu phí
      const periods = [];
      for (let m = 1; m <= 6; m++) {
        periods.push({
          code: `PE${m}_2026`, name: `Tháng ${m}/2026`, period_type: 'monthly',
          month: m, year: 2026, start_date: `2026-0${m}-01`, end_date: `2026-0${m}-28`,
          status: m === 6 ? 'active' : 'closed', created_at: new Date(), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('fee_periods', periods);
      const [dbPeriods] = await queryInterface.sequelize.query(`SELECT id FROM fee_periods`);

      const pFees = dbPeriods.flatMap(p => dbFeeTypes.map(ft => ({
        fee_period_id: p.id, fee_type_id: ft.id, created_at: new Date(), updated_at: new Date()
      })));
      await queryInterface.bulkInsert('period_fees', pFees);

      // 9. Tạo Hóa đơn (900 bản ghi)
      const invoices = [];
      dbPeriods.forEach(p => {
        dbHouseholds.forEach(hh => {
          invoices.push({
            uuid: uuidv4(),
            invoice_number: `INV-${p.id}-${hh.id}-${uuidv4().substring(0,4)}`,
            household_id: hh.id, fee_period_id: p.id,
            total_amount: 0, paid_amount: 0, status: 'PENDING',
            created_by: adminId, created_at: new Date(), updated_at: new Date()
          });
        });
      });
      await queryInterface.bulkInsert('invoices', invoices);
      const [dbInvoices] = await queryInterface.sequelize.query(`SELECT id, household_id FROM invoices`);

      // 10. Tạo Chi tiết hóa đơn (invoice_items) - QUAN TRỌNG CHO /distribution
      const invoiceItems = [];
      const ql = dbFeeTypes.find(f => f.code === 'QL');
      const dien = dbFeeTypes.find(f => f.code === 'DIEN');
      const xeM = dbFeeTypes.find(f => f.code === 'XE_M');
      const xeO = dbFeeTypes.find(f => f.code === 'XE_O');

      dbInvoices.forEach(inv => {
        const hh = dbHouseholds.find(h => h.id === inv.household_id);
        // Phí quản lý
        invoiceItems.push({
          invoice_id: inv.id, fee_type_id: ql.id, quantity: hh.square_meters,
          price_snapshot: ql.unit_price, line_total: parseFloat(hh.square_meters) * 15000, 
          source: 'AUTO', created_at: new Date()
        });
        // Tiền điện
        const kwh = Math.floor(Math.random() * 200 + 50);
        invoiceItems.push({
          invoice_id: inv.id, fee_type_id: dien.id, quantity: kwh,
          price_snapshot: 3500, line_total: kwh * 3500, source: 'MANUAL', created_at: new Date()
        });
        // Phí gửi xe (nếu hộ có xe)
        const hhVehicles = dbVehicles.filter(v => v.household_id === hh.id);
        hhVehicles.forEach(v => {
          const fee = v.vehicle_type === 'car' ? xeO : xeM;
          invoiceItems.push({
            invoice_id: inv.id, fee_type_id: fee.id, quantity: 1,
            price_snapshot: fee.unit_price, line_total: fee.unit_price, source: 'VEHICLE', created_at: new Date()
          });
        });
      });
      await queryInterface.bulkInsert('invoice_items', invoiceItems);

      // 11. Cập nhật Invoices và tạo Payments
      await queryInterface.sequelize.query(`
        UPDATE invoices i JOIN (SELECT invoice_id, SUM(line_total) as total FROM invoice_items GROUP BY invoice_id) items ON i.id = items.invoice_id
        SET i.total_amount = items.total, i.paid_amount = CASE WHEN RAND() > 0.2 THEN items.total ELSE 0 END,
            i.status = CASE WHEN i.paid_amount > 0 THEN 'PAID' ELSE 'PENDING' END
      `);

      const [finalInvoices] = await queryInterface.sequelize.query(`SELECT id, paid_amount FROM invoices WHERE paid_amount > 0`);
      const payments = finalInvoices.map(inv => ({
        invoice_id: inv.id, amount: inv.paid_amount, payment_method: 'transfer',
        payment_date: new Date(), created_by: adminId, created_at: new Date()
      }));
      await queryInterface.bulkInsert('payments', payments);

      console.log("✅ SEEDING THÀNH CÔNG!");
    } catch (error) {
      console.error('❌ LỖI:', error);
      throw error;
    }
  },
  async down(queryInterface) {
    // Logic xóa ngược lại
  }
};