const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Household = sequelize.define(
  'Household',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    room_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    square_meters: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'households',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Household;
