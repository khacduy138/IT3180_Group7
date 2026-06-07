const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const UtilityInvoice = sequelize.define(
  'UtilityInvoice',
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
    household_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    utility_type: {
      type: DataTypes.ENUM('electricity', 'water', 'internet'),
      allowNull: false,
    },
    previous_reading: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    current_reading: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    usage_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'utility_invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = UtilityInvoice;