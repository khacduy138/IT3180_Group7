const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const FeeTypePriceHistory = sequelize.define(
  'FeeTypePriceHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    fee_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    effective_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    effective_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'fee_type_price_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = FeeTypePriceHistory;