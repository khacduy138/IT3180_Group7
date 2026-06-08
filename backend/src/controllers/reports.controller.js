const { Op } = require('sequelize');
const { 
  Invoice, Household, FeePeriod, FeeType, Resident 
} = require('../models');
const ExcelJS = require('exceljs');

const getReportFilters = async (req, res) => {
  try {
    const households = await Household.findAll({
      where: { deleted_at: null },
      attributes: ['id', 'room_number'],
      order: [['room_number', 'ASC']]
    });

    const feeTypes = await FeeType.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      data: {
        households: households.map(h => ({ value: h.id.toString(), label: `phòng ${h.room_number}` })),
        feeTypes: feeTypes.map(ft => ({ value: ft.id.toString(), label: ft.name }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getInvoicesReport = async (req, res) => {
  try {
    const { q, status, startDate, endDate, periodId, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (periodId) where.fee_period_id = periodId;
    
    if (q) {
      where[Op.or] = [
        { invoice_number: { [Op.like]: `%${q}%` } },
        { '$household.room_number$': { [Op.like]: `%${q}%` } }
      ];
    }

    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate + " 00:00:00"), new Date(endDate + " 23:59:59")] };
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Household, as: 'household', attributes: ['room_number'] },
        { model: FeePeriod, as: 'fee_period', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { timeFrame, customDate, activeTab, config } = req.body;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('báo cáo');

    let startDate;
    if (timeFrame === 'custom') {
      startDate = new Date(customDate.start);
    } else {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(timeFrame));
    }

    const dateFilter = { created_at: { [Op.gte]: startDate } };

    if (activeTab === 'people') {
      const where = { ...dateFilter };
      if (config.filters.household !== 'all') where['$households.id$'] = config.filters.household;
      const data = await Resident.findAll({
        include: [{ model: Household, as: 'households', through: { attributes: [] } }],
        where
      });
      const columns = [];
      if (config.columns.includes('full_name')) columns.push({ header: 'họ tên', key: 'full_name', width: 25 });
      if (config.columns.includes('citizen_id')) columns.push({ header: 'cccd', key: 'citizen_id', width: 20 });
      if (config.columns.includes('phone_number')) columns.push({ header: 'sđt', key: 'phone_number', width: 15 });
      worksheet.columns = columns;
      data.forEach(item => worksheet.addRow(item.get({ plain: true })));
    }

    if (activeTab === 'invoice') {
      const where = { ...dateFilter };
      if (config.filters.household !== 'all') where.household_id = config.filters.household;
      const data = await Invoice.findAll({ where, include: [{ model: Household, as: 'household' }] });
      const columns = [];
      if (config.columns.includes('invoice_number')) columns.push({ header: 'mã hóa đơn', key: 'invoice_number', width: 20 });
      if (config.columns.includes('total_amount')) columns.push({ header: 'tổng tiền', key: 'total_amount', width: 15 });
      if (config.columns.includes('status')) columns.push({ header: 'trạng thái', key: 'status', width: 15 });
      worksheet.columns = columns;
      data.forEach(item => worksheet.addRow(item.get({ plain: true })));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReportFilters,
  getInvoicesReport,
  exportExcel
};