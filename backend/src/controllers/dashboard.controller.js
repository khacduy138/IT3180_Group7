const { Op } = require('sequelize');
const { 
  Invoice, 
  Household, 
  Resident, 
  FeePeriod, 
  sequelize 
} = require('../models');

const getSummary = async (req, res) => {
  try {
    const totalHouseholds = await Household.count({ where: { status: 'active' } });

    const stats = await Invoice.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('paid_amount')), 'totalPaid'],
      ],
      raw: true
    });

    const totalAmount = parseFloat(stats[0].totalAmount) || 0;
    const totalCollected = parseFloat(stats[0].totalPaid) || 0;
    
    const collectionRate = totalAmount > 0 
      ? Math.round((totalCollected / totalAmount) * 100) 
      : 0;

    const householdsWithDebt = await Invoice.count({
      distinct: true,
      col: 'household_id',
      where: {
        status: { [Op.ne]: 'PAID' }
      }
    });

    return res.json({
      success: true,
      data: {
        totalCollected,
        collectionRate,
        householdsWithDebt,
        totalHouseholds
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi lấy dữ liệu dashboard' });
  }
};

const getReportByPeriod = async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ message: 'Thiếu periodId' });

  try {
    const report = await Invoice.findAll({
      where: { fee_period_id: periodId },
      include: [
        { model: Household, attributes: ['room_number', 'square_meters'] },
        { model: FeePeriod, attributes: ['name', 'month', 'year'] }
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

module.exports = {
  getSummary,
  getReportByPeriod,
  globalSearch
};