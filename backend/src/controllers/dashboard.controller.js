const { Op, fn, col } = require('sequelize');
const { 
  Invoice, Household, Resident, FeePeriod, 
  Payment, InvoiceItem, FeeType, DemographicChange
} = require('../models');

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
  const { q } = req.query;
  if (!q) return res.json({ households: [], residents: [] });

  try {
    const households = await Household.findAll({
      where: {
        [Op.or]: [
          { room_number: { [Op.like]: `%${q}%` } },
          { uuid: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });

    const residents = await Resident.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.like]: `%${q}%` } },
          { citizen_id: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });

    return res.json({
      success: true,
      data: { households, residents }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tìm kiếm' });
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

module.exports = {
  getSummary,
  getReportByPeriod,
  globalSearch,
  getTrending,
  getFeeDistribution,
  getRecentPayments,
  getDemographicStats
};