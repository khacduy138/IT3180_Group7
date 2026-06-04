const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const InvoiceItem = sequelize.define(
  'InvoiceItem',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fee_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fee_usage_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    price_snapshot: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    line_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'invoice_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = InvoiceItem;
