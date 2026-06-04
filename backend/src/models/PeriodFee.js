const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const PeriodFee = sequelize.define(
  'PeriodFee',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    fee_period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fee_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'period_fees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = PeriodFee;
