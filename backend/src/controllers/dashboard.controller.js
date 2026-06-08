const { Op, fn, col } = require('sequelize');
const { 
  Invoice, Household, Resident, FeePeriod, 
  Payment, InvoiceItem, FeeType, DemographicChange
} = require('../models');
const ExcelJS = require('exceljs');

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalHouseholds = await Household.count({ where: { status: 'active' } });

    const stats = await Invoice.findAll({
      attributes: [
        [fn('SUM', col('total_amount')), 'totalAmount'],
        [fn('SUM', col('paid_amount')), 'totalPaid'],
      ],
      include: [{
        model: FeePeriod,
        as: 'fee_period',
        where: { month: currentMonth, year: currentYear },
        attributes: []
      }],
      raw: true
    });

    const totalTarget = parseFloat(stats[0]?.totalAmount) || 0;
    const totalAmount = parseFloat(stats[0].totalAmount) || 0;
    const totalCollected = parseFloat(stats[0].totalPaid) || 0;
    
    const collectionRate = totalAmount > 0 
      ? Math.round((totalCollected / totalAmount) * 100) 
      : 0;

    const householdsWithDebt = await Invoice.count({
      distinct: true,
      col: 'household_id',
      where: { status: { [Op.ne]: 'PAID' } }
    });

    const occupiedHouseholds = await Household.count({
      where: { 
        status: 'active', 
        deleted_at: null 
      }
    });

    const occupancyRate = totalHouseholds > 0 
      ? ((occupiedHouseholds / totalHouseholds) * 100).toFixed(2) 
      : 0;
    
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentMonthRevenue = await Payment.sum('amount', {
      where: {
        payment_date: {
          [Op.gte]: startOfCurrentMonth,
        }
      }
    }) || 0;

    const previousMonthRevenue = await Payment.sum('amount', {
      where: {
        payment_date: {
          [Op.gte]: startOfPreviousMonth,
          [Op.lte]: endOfPreviousMonth
        }
      }
    }) || 0;

    let revenueGrowth = 0;
    if (previousMonthRevenue > 0) {
      revenueGrowth = (((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(2);
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100;
    }

    return res.json({
      success: true,
      data: {
        totalCollected,
        collectionRate,
        householdsWithDebt,
        totalHouseholds,
        targetAmount: totalTarget,
        revenueGrowth,
        occupancyRate
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi lấy dữ liệu dashboard' });
  }
};

const getTrending = async (req, res) => {
  try {
    const trend = await Invoice.findAll({
      attributes: [
        [fn('SUM', col('total_amount')), 'total'],
        [fn('SUM', col('paid_amount')), 'collected'],
      ],
      include: [{
        model: FeePeriod,
        as: 'fee_period',
        attributes: ['month', 'year']
      }],
      group: ['fee_period.id'],
      order: [[{ model: FeePeriod, as: 'fee_period' }, 'year', 'DESC'], [{ model: FeePeriod, as: 'fee_period' }, 'month', 'DESC']],
      limit: 6,
      raw: true,
      nest: true
    });

    const formattedTrend = trend.map(t => ({
      name: `T${t.fee_period.month}/${t.fee_period.year}`,
      total: parseFloat(t.total),
      collected: parseFloat(t.collected)
    })).reverse();

    res.json({ success: true, data: formattedTrend });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trend data', error: error.message });
  }
};

const getFeeDistribution = async (req, res) => {
  try {
    const distribution = await InvoiceItem.findAll({
      attributes: [
        [fn('SUM', col('line_total')), 'value'],
      ],
      include: [{
        model: FeeType,
        as: 'fee_type',
        attributes: ['name']
      }],
      group: ['fee_type.id'],
      raw: true,
      nest: true
    });

    const formatted = distribution.map(d => ({
      name: d.fee_type.name,
      value: parseFloat(d.value)
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distribution', error: error.message });
  }
};

const getRecentPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      limit: 10,
      order: [['payment_date', 'DESC']],
      include: [{
        model: Invoice,
        as: 'invoice',
        include: [{ model: Household, as: 'household', attributes: ['room_number'] }]
      }]
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent payments', error: error.message });
  }
};

const getReportByPeriod = async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ message: 'Thiếu periodId' });

  try {
    const report = await Invoice.findAll({
      where: { fee_period_id: periodId },
      include: [
        { model: Household, as: 'household', attributes: ['room_number', 'square_meters'] },
        { model: FeePeriod, as: 'fee_period', attributes: ['name', 'month', 'year'] }
      ],
      order: [['status', 'ASC']]
    });

    return res.json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy báo cáo' });
  }
};

const globalSearch = async (req, res) => {
  const { q, category, startDate, endDate } = req.query;
  if (!q && !startDate) return res.json({ success: true, data: { households: [], residents: [], invoices: [] } });

  try {
    const results = { households: [], residents: [], invoices: [] };
    const limit = 10;

    if (!category || category === 'all' || category === 'people') {
      results.households = await Household.findAll({
        where: { room_number: { [Op.like]: `%${q}%` }, deleted_at: null },
        limit
      });

      results.residents = await Resident.findAll({
        where: {
          [Op.or]: [
            { full_name: { [Op.like]: `%${q}%` } },
            { citizen_id: { [Op.like]: `%${q}%` } },
            { phone_number: { [Op.like]: `%${q}%` } }
          ]
        },
        include: [{ model: Household, as: 'households', attributes: ['room_number'], through: { attributes: [] } }],
        limit
      });
    }

    if (!category || category === 'all' || category === 'finance') {
      const whereInvoice = {};
      if (q) {
        whereInvoice.invoice_number = { [Op.like]: `%${q}%` };
      }
      if (startDate && endDate) {
        whereInvoice.created_at = { [Op.between]: [new Date(startDate + " 00:00:00"), new Date(endDate + " 23:59:59")] };
      }

      results.invoices = await Invoice.findAll({
        where: whereInvoice,
        include: [{ model: Household, as: 'household', attributes: ['room_number'] }],
        limit
      });
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error("SEARCH_ERROR:", error);
    return res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
  }
};

const getDemographicStats = async (req, res) => {
  try {
    const totalResidents = await Resident.count();

    const genderDistribution = await Resident.findAll({
      attributes: [
        'gender',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['gender'],
      raw: true
    });

    const changesSummary = await DemographicChange.findAll({
      attributes: [
        'change_type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['change_type'],
      raw: true
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChangesCount = await DemographicChange.count({
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });

    res.json({
      success: true,
      data: {
        totalResidents,
        genderDistribution, 
        changesSummary,
        recentChangesCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching demographic stats', 
      error: error.message 
    });
  }
};

const getExportFilters = async (req, res) => {
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

const exportData = async (req, res) => {
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
      if (config.columns.includes('gender')) columns.push({ header: 'giới tính', key: 'gender', width: 10 });
      if (config.columns.includes('date_of_birth')) columns.push({ header: 'ngày sinh', key: 'date_of_birth', width: 15 });
      worksheet.columns = columns;
      data.forEach(item => worksheet.addRow(item.get({ plain: true })));
    }

    if (activeTab === 'household') {
      const where = { ...dateFilter, deleted_at: null };
      const data = await Household.findAll({ where });
      
      const columns = [];
      if (config.columns.includes('room_number')) columns.push({ header: 'số phòng', key: 'room_number', width: 15 });
      if (config.columns.includes('square_meters')) columns.push({ header: 'diện tích', key: 'square_meters', width: 15 });
      if (config.columns.includes('status')) columns.push({ header: 'trạng thái', key: 'status', width: 15 });
      worksheet.columns = columns;
      data.forEach(item => worksheet.addRow(item.get({ plain: true })));
    }

    if (activeTab === 'invoice') {
      const where = { ...dateFilter };
      if (config.filters.household !== 'all') where.household_id = config.filters.household;

      const data = await Invoice.findAll({
        where,
        include: [{ model: Household, as: 'household' }]
      });

      const columns = [];
      if (config.columns.includes('invoice_number')) columns.push({ header: 'mã hóa đơn', key: 'invoice_number', width: 20 });
      if (config.columns.includes('total_amount')) columns.push({ header: 'tổng tiền', key: 'total_amount', width: 15 });
      if (config.columns.includes('paid_amount')) columns.push({ header: 'đã nộp', key: 'paid_amount', width: 15 });
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

const getInvoicesTable = async (req, res) => {
  try {
    const { q, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'all') where.status = status;
    
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

module.exports = {
  getSummary,
  getTrending,
  getFeeDistribution,
  getRecentPayments,
  getReportByPeriod,
  globalSearch,
  getDemographicStats,
  getExportFilters,
  exportData,
  getInvoicesTable
};