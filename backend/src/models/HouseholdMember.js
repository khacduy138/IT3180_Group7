const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const HouseholdMember = sequelize.define(
  'HouseholdMember',
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
    resident_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    relationship_to_head: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    move_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    move_out_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_temporary_absent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'household_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = HouseholdMember;
