const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const DemographicChange = sequelize.define(
  'DemographicChange',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    resident_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    household_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    change_type: {
      type: DataTypes.ENUM('absence', 'temporary_residence', 'transfer'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    origin_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'demographic_changes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = DemographicChange;
