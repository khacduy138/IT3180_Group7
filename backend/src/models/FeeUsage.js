const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const FeeUsage = sequelize.define(
  'FeeUsage',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    household_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    period_fee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entered_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'fee_usages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = FeeUsage;
