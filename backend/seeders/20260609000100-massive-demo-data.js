'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, _Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("--- Bắt đầu quy trình Seeding dữ liệu khổng lồ (Fix Foreign Key) ---");

      // 1. DỌN SẠCH DỮ LIỆU CŨ
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

      const [users] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`, { transaction });
      const adminId = users.length > 0 ? users[0].id : 1;

      // 2. TẠO 150 HỘ GIA ĐÌNH
      const households = [];
      for (let i = 1; i <= 150; i++) {
        households.push({
          uuid: uuidv4(),
          room_number: `P${Math.floor((i-1)/10)+1}${(i%10+1).toString().padStart(2, '0')}`,
          square_meters: (Math.random() * (120 - 45) + 45).toFixed(2),
          status: 'active', created_at: new Date('2025-01-01'), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('households', households, { transaction });
      const [dbHouseholds] = await queryInterface.sequelize.query(`SELECT id, square_meters FROM households`, { transaction });

      // 3. TẠO 500 CƯ DÂN
      const S = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
      const M = ['Văn', 'Thị', 'Đăng', 'Minh', 'Anh'];
      const L = ['An', 'Bình', 'Chi', 'Dương', 'Hòa', 'Giang', 'Hương', 'Khôi', 'Minh', 'Nam'];
      const residents = [];
      for (let i = 0; i < 500; i++) {
        residents.push({
          uuid: uuidv4(),
          full_name: `${S[i%10]} ${M[Math.floor(i/10)%5]} ${L[i%10]}`,
          citizen_id: `03009${(1000000 + i).toString()}`,
          gender: i % 2 === 0 ? 'Female' : 'Male',
          phone_number: `09${(10000000 + i).toString()}`,
          created_at: new Date('2025-01-01'), updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('residents', residents, { transaction });
      const [dbResidents] = await queryInterface.sequelize.query(`SELECT id FROM residents`, { transaction });

      // 4. LIÊN KẾT HỘ & BIẾN ĐỘNG
      const members = dbResidents.map((res, idx) => ({
        household_id: dbHouseholds[idx % dbHouseholds.length].id,
        resident_id: res.id,
        relationship_to_head: (idx < dbHouseholds.length) ? 'Chủ hộ' : 'Thành viên',
        move_in_date: '2025-01-01', created_at: new Date()
      }));
      await queryInterface.bulkInsert('household_members', members, { transaction });

      const demoChanges = [];
      const changeTypes = ['absence', 'temporary_residence', 'transfer'];
      
      for (let i = 0; i < 100; i++) {
        const type = changeTypes[i % 3];
        const res = dbResidents[i]; // Lấy 100 cư dân đầu tiên
        const hhId = dbHouseholds[i % dbHouseholds.length].id;

        demoChanges.push({
          resident_id: res.id,
          household_id: hhId,
          change_type: type,
          start_date: '2026-06-01',
          destination: type === 'absence' ? 'Quê quán' : (type === 'transfer' ? 'Chung cư khác' : null),
          origin_address: type === 'temporary_residence' ? 'Địa chỉ cũ' : null,
          note: 'Dữ liệu mẫu cho Dashboard',
          created_by: adminId,
          // Quan trọng: Phải là ngày hiện tại để vượt qua bộ lọc 30 ngày của API
          created_at: new Date(), 
          updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('demographic_changes', demoChanges, { transaction });

      // 5. LOẠI PHÍ & LỊCH SỬ GIÁ (Bắt buộc phải có lịch sử giá trước khi tạo đợt thu)
      const feeTypes = [
        { code: 'QL', name: 'Phí quản lý', calculation_type: 'per_m2', unit_price: 15000, invoice_generation_mode: 'AUTO' },
        { code: 'DIEN', name: 'Tiền điện', calculation_type: 'fixed', unit_price: 3500, invoice_generation_mode: 'MANUAL_INPUT' },
        { code: 'NUOC', name: 'Tiền nước', calculation_type: 'fixed', unit_price: 12000, invoice_generation_mode: 'MANUAL_INPUT' },
        { code: 'XE_M', name: 'Gửi xe máy', calculation_type: 'fixed', unit_price: 70000, invoice_generation_mode: 'CONDITIONAL_VEHICLE', vehicle_type: 'motorbike' }
      ];
      await queryInterface.bulkInsert('fee_types', feeTypes.map(f => ({...f, created_at: new Date(), updated_at: new Date()})), { transaction });
      const [dbFeeTypes] = await queryInterface.sequelize.query(`SELECT id, unit_price FROM fee_types`, { transaction });

      const priceHistory = dbFeeTypes.map(ft => ({
        fee_type_id: ft.id, unit_price: ft.unit_price, effective_from: '2025-01-01', 
        created_by: adminId, created_at: new Date(), updated_at: new Date()
      }));
      await queryInterface.bulkInsert('fee_type_price_history', priceHistory, { transaction });
      const [dbHistory] = await queryInterface.sequelize.query(`SELECT id, fee_type_id FROM fee_type_price_history`, { transaction });

      // 6. KỲ THU PHÍ (12 tháng)
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
          created_at: new Date()
        });
      }
      await queryInterface.bulkInsert('fee_periods', periods, { transaction });
      const [dbPeriods] = await queryInterface.sequelize.query(`SELECT id FROM fee_periods`, { transaction });

      // 7. LIÊN KẾT PHÍ VÀO KỲ (period_fees & fee_period_fee_types)
      const pFees = [];
      const pfLinkage = [];
      dbPeriods.forEach(p => {
        dbHistory.forEach(h => {
          pFees.push({ fee_period_id: p.id, fee_type_id: h.fee_type_id, created_at: new Date() });
          pfLinkage.push({ 
            fee_period_id: p.id, fee_type_id: h.fee_type_id, price_history_id: h.id, 
            is_required: 1, created_at: new Date() 
          });
        });
      });
      await queryInterface.bulkInsert('period_fees', pFees, { transaction });
      await queryInterface.bulkInsert('fee_period_fee_types', pfLinkage, { transaction });

      // 8. HÓA ĐƠN & CHI TIẾT (12 tháng x 150 hộ = 1800 hóa đơn)
      const invoices = [];
      dbPeriods.forEach(p => {
        dbHouseholds.forEach(hh => {
          invoices.push({
            uuid: uuidv4(), invoice_number: `INV-${p.id}-${hh.id}-${uuidv4().substring(0,4)}`,
            household_id: hh.id, fee_period_id: p.id, total_amount: 0, paid_amount: 0, status: 'PENDING',
            created_by: adminId, created_at: new Date()
          });
        });
      });
      await queryInterface.bulkInsert('invoices', invoices, { transaction });
      const [dbInvoices] = await queryInterface.sequelize.query(`SELECT id, household_id FROM invoices`, { transaction });

      const invoiceItems = [];
      const qlFeeId = dbFeeTypes[0].id;
      dbInvoices.forEach(inv => {
        const hh = dbHouseholds.find(h => h.id === inv.household_id);
        const amt = parseFloat(hh.square_meters) * 15000;
        invoiceItems.push({
          invoice_id: inv.id, fee_type_id: qlFeeId, quantity: hh.square_meters,
          price_snapshot: 15000, line_total: amt, source: 'AUTO', created_at: new Date()
        });
      });
      await queryInterface.bulkInsert('invoice_items', invoiceItems, { transaction });

      // 9. CẬP NHẬT TỔNG TIỀN & THANH TOÁN
      await queryInterface.sequelize.query(`
        UPDATE invoices i JOIN (SELECT invoice_id, SUM(line_total) as total FROM invoice_items GROUP BY invoice_id) items ON i.id = items.invoice_id
        SET i.total_amount = items.total, i.paid_amount = CASE WHEN RAND() > 0.3 THEN items.total ELSE 0 END,
            i.status = CASE WHEN i.paid_amount > 0 THEN 'PAID' ELSE 'PENDING' END
      `, { transaction });

      const [paidInvoices] = await queryInterface.sequelize.query(`SELECT id, paid_amount FROM invoices WHERE paid_amount > 0`, { transaction });
      const finalPayments = paidInvoices.map(inv => ({
        invoice_id: inv.id, amount: inv.paid_amount, payment_method: 'transfer',
        payment_date: new Date(), created_by: adminId, created_at: new Date()
      }));
      await queryInterface.bulkInsert('payments', finalPayments, { transaction });

      await transaction.commit();
      console.log("✅ SEEDING MASSIVE DATA HOÀN TẤT!");
    } catch (error) {
      await transaction.rollback();
      console.error('❌ LỖI SEED DỮ LIỆU:', error.message);
      throw error;
    }
  },
};