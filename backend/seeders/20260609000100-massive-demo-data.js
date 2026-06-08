'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, _Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("--- Bắt đầu quy trình Seeding dữ liệu khổng lồ ---");

      // 1. DỌN SẠCH DỮ LIỆU CŨ (Tránh lỗi UNIQUE và Foreign Key)
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { transaction });
      const tables = [
        'payments', 'invoice_items', 'invoices', 'fee_usages', 'utility_invoices',
        'period_fees', 'fee_period_fee_types', 'fee_periods', 'fee_type_price_history', 'fee_types',
        'vehicles', 'household_members', 'demographic_changes', 'residents', 'households'
      ];
      for (const table of tables) {
        await queryInterface.sequelize.query(`TRUNCATE TABLE ${table};`, { transaction });
      }
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { transaction });

      // Lấy admin_id để gán vào created_by
      const [users] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`, { transaction });
      const adminId = users.length > 0 ? users[0].id : 1;

      // 2. TẠO 150 HỘ GIA ĐÌNH (households)
      const households = [];
      for (let i = 1; i <= 150; i++) {
        const floor = Math.floor((i - 1) / 10) + 1;
        const room = ((i - 1) % 10) + 1;
        households.push({
          uuid: uuidv4(),
          room_number: `P${floor}${room.toString().padStart(2, '0')}`,
          square_meters: (Math.random() * (120 - 45) + 45).toFixed(2),
          status: i % 15 === 0 ? 'inactive' : 'active',
          created_at: new Date('2025-06-01'), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('households', households, { transaction });
      const [dbHouseholds] = await queryInterface.sequelize.query(`SELECT id, square_meters FROM households`, { transaction });

      // 3. TẠO 500 CƯ DÂN (residents) - Dùng tổ hợp Họ + Lót + Tên
      const S = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
      const M = ['Văn', 'Thị', 'Đăng', 'Minh', 'Hoài'];
      const L = ['An', 'Bình', 'Chi', 'Dương', 'Hòa', 'Giang', 'Hương', 'Khôi', 'Minh', 'Nam'];
      const residents = [];
      let rCount = 0;
      for (let s=0; s<S.length; s++)
        for (let m=0; m<M.length; m++)
          for (let l=0; l<L.length; l++) {
            if (rCount >= 500) break;
            residents.push({
              uuid: uuidv4(),
              full_name: `${S[s]} ${M[m]} ${L[l]}`,
              citizen_id: `03009${(1000000 + rCount).toString()}`,
              gender: M[m] === 'Thị' ? 'Female' : 'Male',
              phone_number: `09${(10000000 + rCount).toString()}`,
              created_at: new Date('2025-06-01'), updated_at: new Date()
            });
            rCount++;
          }
      await queryInterface.bulkInsert('residents', residents, { transaction });
      const [dbResidents] = await queryInterface.sequelize.query(`SELECT id FROM residents`, { transaction });

      // 4. THÀNH VIÊN HỘ (household_members)
      const members = dbResidents.map((res, idx) => ({
        household_id: dbHouseholds[idx % dbHouseholds.length].id,
        resident_id: res.id,
        relationship_to_head: (idx < dbHouseholds.length) ? 'Chủ hộ' : 'Thành viên',
        move_in_date: '2025-06-01',
        created_at: new Date(), updated_at: new Date()
      }));
      await queryInterface.bulkInsert('household_members', members, { transaction });

      // 5. BIẾN ĐỘNG NHÂN KHẨU (demographic_changes) - Tạo 120 bản ghi
      const changes = [];
      for (let i = 0; i < 120; i++) {
        const typeArr = ['absence', 'temporary_residence', 'transfer'];
        changes.push({
          resident_id: dbResidents[i].id,
          household_id: dbHouseholds[i % dbHouseholds.length].id,
          change_type: typeArr[i % 3],
          start_date: '2026-01-10',
          destination: i % 3 === 0 ? 'Hà Nội' : null,
          origin_address: i % 3 === 1 ? 'TP.HCM' : null,
          note: 'Dữ liệu Seeder',
          created_by: adminId, created_at: new Date()
        });
      }
      await queryInterface.bulkInsert('demographic_changes', changes, { transaction });

      // 6. LOẠI PHÍ (fee_types)
      const feeTypes = [
        { code: 'QL', name: 'Phí quản lý', calculation_type: 'per_m2', unit_price: 15000, invoice_generation_mode: 'AUTO' },
        { code: 'DIEN', name: 'Tiền điện', calculation_type: 'fixed', unit_price: 3500, invoice_generation_mode: 'MANUAL_INPUT' },
        { code: 'NUOC', name: 'Tiền nước', calculation_type: 'fixed', unit_price: 12000, invoice_generation_mode: 'MANUAL_INPUT' },
        { code: 'XE_M', name: 'Gửi xe máy', calculation_type: 'fixed', unit_price: 70000, invoice_generation_mode: 'CONDITIONAL_VEHICLE', vehicle_type: 'motorbike' },
        { code: 'XE_O', name: 'Gửi ô tô', calculation_type: 'fixed', unit_price: 1200000, invoice_generation_mode: 'CONDITIONAL_VEHICLE', vehicle_type: 'car' }
      ];
      await queryInterface.bulkInsert('fee_types', feeTypes.map(f => ({...f, created_at: new Date(), updated_at: new Date()})), { transaction });
      const [dbFeeTypes] = await queryInterface.sequelize.query(`SELECT id, code, unit_price FROM fee_types`, { transaction });

      // 7. KỲ THU PHÍ (fee_periods) - 12 tháng
      const periods = [];
      for (let m = 1; m <= 12; m++) {
        const year = m > 6 ? 2026 : 2025;
        const month = m > 6 ? m - 6 : m + 6;
        periods.push({
          code: `PE${m}_${year}`, name: `Tháng ${month}/${year}`,
          period_type: 'monthly', month: month, year: year,
          start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
          end_date: `${year}-${month.toString().padStart(2, '0')}-28`,
          status: (year === 2026 && month === 6) ? 'active' : (year === 2026 && month > 6 ? 'draft' : 'closed'),
          created_at: new Date(), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('fee_periods', periods, { transaction });
      const [dbPeriods] = await queryInterface.sequelize.query(`SELECT id, month, year FROM fee_periods`, { transaction });

      // 8. PHÍ THEO KỲ (period_fees & fee_period_fee_types)
      const pFees = [];
      const pfFTypes = [];
      dbPeriods.forEach(p => {
        dbFeeTypes.forEach(ft => {
          pFees.push({ fee_period_id: p.id, fee_type_id: ft.id, created_at: new Date(), updated_at: new Date() });
          pfFTypes.push({ 
            fee_period_id: p.id, fee_type_id: ft.id, price_history_id: 1, 
            is_required: 1, created_at: new Date(), updated_at: new Date() 
          });
        });
      });
      await queryInterface.bulkInsert('period_fees', pFees, { transaction });
      await queryInterface.bulkInsert('fee_period_fee_types', pfFTypes, { transaction });

      // 9. PHƯƠNG TIỆN (vehicles) - 200 xe
      const vehicles = [];
      for (let i = 0; i < 200; i++) {
        vehicles.push({
          household_id: dbHouseholds[i % dbHouseholds.length].id,
          license_plate: `${Math.floor(Math.random()*89+10)}A-${30000 + i}`,
          vehicle_type: i % 4 === 0 ? 'car' : 'motorbike',
          registered_at: '2025-06-01', is_active: 1, created_at: new Date()
        });
      }
      await queryInterface.bulkInsert('vehicles', vehicles, { transaction });

      // 10. HÓA ĐƠN & CHI TIẾT (invoices & invoice_items) - 12 tháng x 150 hộ = 1800 hóa đơn
      const invoices = [];
      dbPeriods.forEach(p => {
        dbHouseholds.forEach(hh => {
          invoices.push({
            uuid: uuidv4(),
            invoice_number: `INV-${p.year}${p.month}-${hh.id}-${uuidv4().substring(0,4)}`,
            household_id: hh.id, fee_period_id: p.id,
            total_amount: 0, paid_amount: 0, status: 'PENDING',
            created_by: adminId, created_at: new Date(p.year, p.month-1, 10)
          });
        });
      });
      await queryInterface.bulkInsert('invoices', invoices, { transaction });
      const [dbInvoices] = await queryInterface.sequelize.query(`SELECT id, household_id FROM invoices`, { transaction });

      // 11. CHI TIẾT HÓA ĐƠN (invoice_items) - QUAN TRỌNG
      const invoiceItems = [];
      const ql = dbFeeTypes.find(f => f.code === 'QL');
      const dien = dbFeeTypes.find(f => f.code === 'DIEN');
      
      dbInvoices.forEach(inv => {
        const hh = dbHouseholds.find(h => h.id === inv.household_id);
        const qlVal = parseFloat(hh.square_meters) * 15000;
        const dienVal = Math.floor(Math.random() * 300000 + 100000);
        invoiceItems.push({
          invoice_id: inv.id, fee_type_id: ql.id, quantity: hh.square_meters,
          price_snapshot: 15000, line_total: qlVal, source: 'AUTO', created_at: new Date()
        });
        invoiceItems.push({
          invoice_id: inv.id, fee_type_id: dien.id, quantity: 1,
          price_snapshot: dienVal, line_total: dienVal, source: 'MANUAL', created_at: new Date()
        });
      });
      await queryInterface.bulkInsert('invoice_items', invoiceItems, { transaction });

      // 12. THANH TOÁN (payments) - Cập nhật Invoices
      await queryInterface.sequelize.query(`
        UPDATE invoices i JOIN (SELECT invoice_id, SUM(line_total) as total FROM invoice_items GROUP BY invoice_id) items ON i.id = items.invoice_id
        SET i.total_amount = items.total, 
            i.paid_amount = CASE WHEN RAND() > 0.3 THEN items.total ELSE (CASE WHEN RAND() > 0.5 THEN items.total/2 ELSE 0 END) END,
            i.status = CASE WHEN i.paid_amount >= i.total_amount THEN 'PAID' WHEN i.paid_amount > 0 THEN 'PARTIAL' ELSE 'PENDING' END
      `, { transaction });

      const [finalInvoices] = await queryInterface.sequelize.query(`SELECT id, paid_amount FROM invoices WHERE paid_amount > 0`, { transaction });
      const payments = finalInvoices.map((inv, idx) => ({
        invoice_id: inv.id,
        amount: inv.paid_amount,
        payment_method: 'transfer',
        payment_date: new Date(Date.now() - idx * 600000), 
        created_by: adminId,
        created_at: new Date(Date.now() - idx * 600000), 
    }));
      await queryInterface.bulkInsert('payments', payments, { transaction });

      await transaction.commit();
      console.log("✅ MASSIVE SEEDING HOÀN TẤT!");
    } catch (error) {
      await transaction.rollback();
      console.error('❌ LỖI SEED DỮ LIỆU:', error);
      throw error;
    }
  }
};